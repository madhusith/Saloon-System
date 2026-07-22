// server/src/repositories/appointmentRepository.js
import { pool } from '../config/database.js';

export const appointmentRepository = {
    /**
     * Check if a stylist has any overlapping appointments (double-booking protection)
     * Overlap condition: start_time < existing_end AND end_time > existing_start
     */
    async checkTimeOverlap(staffId, date, startTime, endTime, excludeAppointmentId = null) {
        let query = `
      SELECT id FROM appointments 
      WHERE staff_id = ? 
        AND appointment_date = ? 
        AND status NOT IN ('CANCELLED', 'NO_SHOW')
        AND start_time < ? 
        AND end_time > ?
        AND deleted_at IS NULL
    `;
        const params = [staffId, date, endTime, startTime];

        if (excludeAppointmentId) {
            query += ' AND id != ?';
            params.push(excludeAppointmentId);
        }

        const [rows] = await pool.execute(query, params);
        return rows.length > 0;
    },

    /**
     * Get all active appointments for a stylist on a specific date (used by slot calculator)
     */
    async getAppointmentsForStylist(staffId, date) {
        const [rows] = await pool.execute(
            `SELECT start_time, end_time FROM appointments 
       WHERE staff_id = ? 
         AND appointment_date = ? 
         AND status NOT IN ('CANCELLED', 'NO_SHOW')
         AND deleted_at IS NULL`,
            [staffId, date]
        );
        return rows;
    },

    /**
     * Create a new appointment and its linked services within a transaction
     */
    async create(appointmentData) {
        const {
            customerId,
            staffId,
            bookingReference,
            appointmentDate,
            startTime,
            endTime,
            totalDurationMinutes,
            totalPrice,
            notes,
            serviceIds
        } = appointmentData;

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Insert appointment details
            const [apptResult] = await connection.execute(
                `INSERT INTO appointments (
          customer_id, staff_id, booking_reference, appointment_date, 
          start_time, end_time, total_duration_minutes, total_price, notes
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    customerId,
                    staffId,
                    bookingReference,
                    appointmentDate,
                    startTime,
                    endTime,
                    totalDurationMinutes,
                    totalPrice,
                    notes
                ]
            );

            const appointmentId = apptResult.insertId;

            // 2. Link services
            const serviceValues = [];
            const placeholders = serviceIds.map((serviceId) => {
                serviceValues.push(appointmentId, serviceId);
                return '(?, ?)';
            }).join(', ');

            await connection.execute(
                `INSERT INTO appointment_services (appointment_id, service_id) VALUES ${placeholders}`,
                serviceValues
            );

            await connection.commit();
            return { id: appointmentId, ...appointmentData };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    /**
     * Retrieve appointment by ID, joining details of services, customer name, and staff name
     */
    async findById(id) {
        const [rows] = await pool.execute(
            `SELECT a.*, 
              u_cust.full_name AS customer_name, u_cust.email AS customer_email, u_cust.phone AS customer_phone,
              u_staff.full_name AS staff_name
       FROM appointments a
       INNER JOIN users u_cust ON a.customer_id = u_cust.id
       INNER JOIN users u_staff ON a.staff_id = u_staff.id
       WHERE a.id = ? AND a.deleted_at IS NULL`,
            [id]
        );

        if (rows.length === 0) return null;
        const appointment = rows[0];

        // Load related services
        const [services] = await pool.execute(
            `SELECT s.* FROM services s
       INNER JOIN appointment_services aserv ON s.id = aserv.service_id
       WHERE aserv.appointment_id = ?`,
            [id]
        );

        appointment.services = services;
        return appointment;
    },

    /**
     * Retrieve appointment by reference
     */
    async findByReference(bookingReference) {
        const [rows] = await pool.execute(
            `SELECT id FROM appointments WHERE booking_reference = ? AND deleted_at IS NULL`,
            [bookingReference]
        );
        if (rows.length === 0) return null;
        return this.findById(rows[0].id);
    },

    /**
     * Update appointment status (PENDING, CONFIRMED, etc.)
     */
    async updateStatus(id, status) {
        await pool.execute(
            'UPDATE appointments SET status = ? WHERE id = ?',
            [status, id]
        );
    },

    /**
     * Check in an appointment (sets status to WAITING and records check_in_time)
     */
    async checkIn(id) {
        await pool.execute(
            `UPDATE appointments 
             SET status = 'WAITING', check_in_time = NOW() 
             WHERE id = ?`,
            [id]
        );
    },

    /**
     * List all appointments with pagination, ordering, and optional filters
     */
    async listAll({ date, status, staffId, customerId, limit = 10, offset = 0 } = {}) {
        let query = `
      SELECT a.*, 
             u_cust.full_name AS customer_name, u_cust.email AS customer_email,
             u_staff.full_name AS staff_name
      FROM appointments a
      INNER JOIN users u_cust ON a.customer_id = u_cust.id
      INNER JOIN users u_staff ON a.staff_id = u_staff.id
      WHERE a.deleted_at IS NULL
    `;
        const params = [];

        if (date) {
            query += ' AND a.appointment_date = ?';
            params.push(date);
        }

        if (status) {
            query += ' AND a.status = ?';
            params.push(status);
        }

        if (staffId) {
            query += ' AND a.staff_id = ?';
            params.push(Number(staffId));
        }

        if (customerId) {
            query += ' AND a.customer_id = ?';
            params.push(Number(customerId));
        }

        // Get count
        const countQuery = `SELECT COUNT(*) as count FROM (${query}) as t`;
        const [countRows] = await pool.query(countQuery, params);
        const total = countRows[0].count;

        // Add pagination
        query += ' ORDER BY a.appointment_date DESC, a.start_time ASC LIMIT ? OFFSET ?';
        params.push(Number(limit), Number(offset));

        const [appointments] = await pool.query(query, params);

        // Load services for each appointment
        for (const appt of appointments) {
            const [services] = await pool.execute(
                `SELECT s.id, s.name, s.price FROM services s
         INNER JOIN appointment_services aserv ON s.id = aserv.service_id
         WHERE aserv.appointment_id = ?`,
                [appt.id]
            );
            appt.services = services;
        }

        return { appointments, total };
    }
};

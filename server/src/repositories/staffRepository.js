import { pool } from '../config/database.js';

export const staffRepository = {
  /**
   * List all staff users (role = 'STAFF') along with their profiles
   */
  async listAllStaff() {
    const [rows] = await pool.execute(
      `SELECT u.id, u.full_name, u.email, u.phone, u.status,
              sp.specialization, sp.experience_years, sp.bio, sp.profile_image_url
       FROM users u
       LEFT JOIN staff_profiles sp ON u.id = sp.user_id
       WHERE u.role = 'STAFF' AND u.deleted_at IS NULL`
    );
    return rows;
  },

  /**
   * Find staff profile details by userId
   */
  async findStaffProfile(userId) {
    const [rows] = await pool.execute(
      `SELECT u.id, u.full_name, u.email, u.phone, u.status,
              sp.specialization, sp.experience_years, sp.bio, sp.profile_image_url
       FROM users u
       LEFT JOIN staff_profiles sp ON u.id = sp.user_id
       WHERE u.id = ? AND u.role = 'STAFF' AND u.deleted_at IS NULL`,
      [userId]
    );
    return rows[0] || null;
  },

  /**
   * Find stylists assigned to a specific service
   */
  async findEligibleStylists(serviceId) {
    const [rows] = await pool.execute(
      `SELECT u.id, u.full_name, u.email, u.phone,
              sp.specialization, sp.experience_years, sp.bio, sp.profile_image_url
       FROM users u
       INNER JOIN staff_services ss ON u.id = ss.staff_id
       LEFT JOIN staff_profiles sp ON u.id = sp.user_id
       WHERE ss.service_id = ? AND u.role = 'STAFF' AND u.status = 'ACTIVE' AND u.deleted_at IS NULL`,
      [serviceId]
    );
    return rows;
  },

  /**
   * Get weekly schedule of a staff member
   */
  async getSchedule(staffId) {
    const [rows] = await pool.execute(
      'SELECT day_of_week, is_working, start_time, end_time FROM staff_schedules WHERE staff_id = ? ORDER BY FIELD(day_of_week, "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY")',
      [staffId]
    );
    return rows;
  },

  /**
   * Upsert a weekly schedule row
   */
  async updateSchedule(staffId, scheduleItems) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const item of scheduleItems) {
        await connection.execute(
          `INSERT INTO staff_schedules (staff_id, day_of_week, is_working, start_time, end_time)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE is_working = VALUES(is_working), start_time = VALUES(start_time), end_time = VALUES(end_time)`,
          [
            staffId,
            item.dayOfWeek,
            item.isWorking ? 1 : 0,
            item.isWorking ? item.startTime : null,
            item.isWorking ? item.endTime : null
          ]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Get unavailability/blocked periods for a staff member
   */
  async getUnavailability(staffId) {
    const [rows] = await pool.execute(
      'SELECT id, unavailability_type, start_datetime, end_datetime, description FROM staff_unavailability WHERE staff_id = ? ORDER BY start_datetime ASC',
      [staffId]
    );
    return rows;
  },

  /**
   * Add a custom unavailability period
   */
  async addUnavailability(staffId, data) {
    const [result] = await pool.execute(
      'INSERT INTO staff_unavailability (staff_id, unavailability_type, start_datetime, end_datetime, description) VALUES (?, ?, ?, ?, ?)',
      [
        staffId,
        data.unavailabilityType,
        data.startDatetime,
        data.endDatetime,
        data.description || null
      ]
    );
    return { id: result.insertId, staffId, ...data };
  },

  /**
   * Remove a custom unavailability period
   */
  async deleteUnavailability(staffId, slotId) {
    const [result] = await pool.execute(
      'DELETE FROM staff_unavailability WHERE id = ? AND staff_id = ?',
      [slotId, staffId]
    );
    return result.affectedRows > 0;
  }
};

import { pool } from '../config/database.js';

export const serviceRepository = {
  /**
   * Find a service by ID
   */
  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM services WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Find a service by name (for duplication checks)
   */
  async findByName(name) {
    const [rows] = await pool.execute(
      'SELECT * FROM services WHERE name = ? AND deleted_at IS NULL',
      [name]
    );
    return rows[0] || null;
  },

  /**
   * Create a new service
   */
  async create(service) {
    const [result] = await pool.execute(
      'INSERT INTO services (name, description, category, duration_minutes, price, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        service.name,
        service.description || null,
        service.category,
        service.durationMinutes,
        service.price,
        service.imageUrl || null,
        service.status || 'ACTIVE'
      ]
    );
    return { id: result.insertId, ...service };
  },

  /**
   * Update an existing service
   */
  async update(id, updates) {
    const fields = [];
    const values = [];
    
    // Map camelCase to snake_case for DB fields
    const mapping = {
      name: 'name',
      description: 'description',
      category: 'category',
      durationMinutes: 'duration_minutes',
      price: 'price',
      imageUrl: 'image_url',
      status: 'status'
    };

    for (const [key, val] of Object.entries(updates)) {
      if (mapping[key] !== undefined) {
        fields.push(`${mapping[key]} = ?`);
        values.push(val);
      }
    }

    if (fields.length === 0) return;

    values.push(id);
    await pool.execute(
      `UPDATE services SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
      values
    );
  },

  /**
   * Soft delete a service
   */
  async delete(id) {
    await pool.execute(
      'UPDATE services SET deleted_at = NOW() WHERE id = ?',
      [id]
    );
  },

  /**
   * List services with filters and pagination
   */
  async listAll({ category, status, search, limit = 10, offset = 0 } = {}) {
    let query = 'SELECT * FROM services WHERE deleted_at IS NULL';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM (${query}) as t`;
    const [countRows] = await pool.execute(countQuery, params);
    const total = countRows[0].count;

    query += ' ORDER BY category ASC, name ASC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const [services] = await pool.query(query, params);

    return { services, total };
  },

  /**
   * Assign staff members to a service
   */
  async assignStaff(serviceId, staffIds) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Clear existing associations
      await connection.execute(
        'DELETE FROM staff_services WHERE service_id = ?',
        [serviceId]
      );

      // Insert new associations
      if (staffIds.length > 0) {
        const values = [];
        const placeholders = staffIds.map((staffId) => {
          values.push(staffId, serviceId);
          return '(?, ?)';
        }).join(', ');

        await connection.execute(
          `INSERT INTO staff_services (staff_id, service_id) VALUES ${placeholders}`,
          values
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
   * Get all staff IDs assigned to a service
   */
  async getAssignedStaffIds(serviceId) {
    const [rows] = await pool.execute(
      'SELECT staff_id FROM staff_services WHERE service_id = ?',
      [serviceId]
    );
    return rows.map((row) => row.staff_id);
  }
};

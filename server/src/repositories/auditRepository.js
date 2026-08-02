import { pool } from '../config/database.js';

export const auditRepository = {
  /**
   * Log an audit action
   * @param {Object} logData 
   */
  async create({
    userId,
    action,
    entityType = null,
    entityId = null,
    oldValuesJson = null,
    newValuesJson = null,
    ipAddress = null
  }) {
    await pool.execute(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values_json, new_values_json, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        userId || null,
        action,
        entityType,
        entityId,
        oldValuesJson ? JSON.stringify(oldValuesJson) : null,
        newValuesJson ? JSON.stringify(newValuesJson) : null,
        ipAddress
      ]
    );
  },

  /**
   * List all audit logs with pagination and filters
   */
  async listAll({ userId, action, limit = 20, offset = 0 } = {}) {
    let query = `
      SELECT al.*, u.full_name AS user_name, u.email AS user_email, u.role AS user_role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (userId) {
      query += ' AND al.user_id = ?';
      params.push(Number(userId));
    }

    if (action) {
      query += ' AND al.action = ?';
      params.push(action);
    }

    // Get count
    const countQuery = `SELECT COUNT(*) as count FROM (${query}) as t`;
    const [countRows] = await pool.query(countQuery, params);
    const total = countRows[0].count;

    // Add ordering and limits
    query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const [logs] = await pool.query(query, params);
    return { logs, total };
  }
};

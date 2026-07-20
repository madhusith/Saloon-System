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
  }
};

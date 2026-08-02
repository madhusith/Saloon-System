import { pool } from '../config/database.js';

export const notificationRepository = {
  /**
   * Log an email notification
   * @param {Object} data 
   * @returns {Number} Notification ID
   */
  async createNotification({
    userId = null,
    recipientEmail,
    notificationType,
    subject,
    relatedEntityType = null,
    relatedEntityId = null,
    status = 'PENDING',
    errorMessage = null,
    sentAt = null
  }) {
    const [result] = await pool.execute(
      'INSERT INTO notifications (user_id, recipient_email, notification_type, subject, related_entity_type, related_entity_id, status, error_message, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        userId,
        recipientEmail,
        notificationType,
        subject,
        relatedEntityType,
        relatedEntityId,
        status,
        errorMessage,
        sentAt
      ]
    );
    return result.insertId;
  },

  /**
   * Update notification status (e.g. from PENDING to SENT or FAILED)
   * @param {Number} id 
   * @param {Object} statusData 
   */
  async updateNotificationStatus(id, { status, errorMessage = null, sentAt = null, retryCount = null }) {
    const fields = ['status = ?'];
    const params = [status];

    if (errorMessage !== null) {
      fields.push('error_message = ?');
      params.push(errorMessage);
    }
    if (sentAt !== null) {
      fields.push('sent_at = ?');
      params.push(sentAt);
    }
    if (retryCount !== null) {
      fields.push('retry_count = ?');
      params.push(retryCount);
    }

    params.push(id);
    await pool.execute(
      `UPDATE notifications SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
  },

  /**
   * List all email notifications with pagination and filters
   */
  async listAll({ recipientEmail, status, limit = 20, offset = 0 } = {}) {
    let query = `
      SELECT n.*, u.full_name AS user_name 
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (recipientEmail) {
      query += ' AND n.recipient_email LIKE ?';
      params.push(`%${recipientEmail}%`);
    }

    if (status) {
      query += ' AND n.status = ?';
      params.push(status);
    }

    // Get count
    const countQuery = `SELECT COUNT(*) as count FROM (${query}) as t`;
    const [countRows] = await pool.query(countQuery, params);
    const total = countRows[0].count;

    // Add ordering and limits
    query += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const [notifications] = await pool.query(query, params);
    return { notifications, total };
  }
};

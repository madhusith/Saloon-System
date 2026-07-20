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
  }
};

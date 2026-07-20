import { pool } from '../config/database.js';

export const tokenRepository = {
  /**
   * Save a newly generated authentication token
   * @param {Object} tokenObj
   */
  async saveToken({ userId, tokenType, tokenHash, expiresAt }) {
    await pool.execute(
      'INSERT INTO auth_tokens (user_id, token_type, token_hash, expires_at) VALUES (?, ?, ?, ?)',
      [userId, tokenType, tokenHash, expiresAt]
    );
  },

  /**
   * Find an active, unused token of a specific type by its hash
   * @param {String} tokenHash 
   * @param {String} tokenType 
   * @returns {Object|null}
   */
  async findActiveByHash(tokenHash, tokenType) {
    const [rows] = await pool.execute(
      'SELECT * FROM auth_tokens WHERE token_hash = ? AND token_type = ? AND expires_at > NOW() AND used_at IS NULL',
      [tokenHash, tokenType]
    );
    return rows[0] || null;
  },

  /**
   * Mark a token as used
   * @param {Number} id 
   */
  async useToken(id) {
    await pool.execute(
      'UPDATE auth_tokens SET used_at = NOW() WHERE id = ?',
      [id]
    );
  },

  /**
   * Invalidate all tokens of a specific type for a user (e.g. on logout or password change)
   * @param {Number} userId 
   * @param {String} tokenType 
   */
  async invalidateUserTokens(userId, tokenType) {
    await pool.execute(
      'DELETE FROM auth_tokens WHERE user_id = ? AND token_type = ?',
      [userId, tokenType]
    );
  },

  /**
   * Clean up expired tokens from the database
   */
  async deleteExpiredTokens() {
    await pool.execute(
      'DELETE FROM auth_tokens WHERE expires_at < NOW()'
    );
  }
};

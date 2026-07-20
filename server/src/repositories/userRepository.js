import { pool } from '../config/database.js';

export const userRepository = {
  /**
   * Find a user by their email address
   * @param {String} email 
   * @returns {Object|null}
   */
  async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL',
      [email]
    );
    return rows[0] || null;
  },

  /**
   * Find a user by their ID
   * @param {Number} id 
   * @returns {Object|null}
   */
  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, full_name, email, phone, role, email_verified_at, must_change_password, status, created_at, updated_at FROM users WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Find a user profile (customer or staff) by user ID
   * @param {Number} userId 
   * @param {String} role 
   * @returns {Object|null}
   */
  async findProfileByUserId(userId, role) {
    if (role === 'CUSTOMER') {
      const [rows] = await pool.execute(
        'SELECT * FROM customer_profiles WHERE user_id = ?',
        [userId]
      );
      return rows[0] || null;
    } else if (role === 'STAFF') {
      const [rows] = await pool.execute(
        'SELECT * FROM staff_profiles WHERE user_id = ?',
        [userId]
      );
      return rows[0] || null;
    }
    return null;
  },

  /**
   * Create a customer user along with a customer profile inside a transaction
   * @param {Object} user 
   * @param {Object} profile 
   * @returns {Object}
   */
  async createCustomer(user, profile = {}) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [userResult] = await connection.execute(
        'INSERT INTO users (full_name, email, phone, password_hash, role, email_verified_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          user.fullName,
          user.email,
          user.phone || null,
          user.passwordHash,
          'CUSTOMER',
          user.emailVerifiedAt || null,
          user.status || 'ACTIVE'
        ]
      );

      const userId = userResult.insertId;

      await connection.execute(
        'INSERT INTO customer_profiles (user_id, address, notes) VALUES (?, ?, ?)',
        [userId, profile.address || null, profile.notes || null]
      );

      await connection.commit();
      return { id: userId, ...user, role: 'CUSTOMER' };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Create a staff user along with a staff profile inside a transaction
   * @param {Object} user 
   * @param {Object} profile 
   * @returns {Object}
   */
  async createStaff(user, profile = {}) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [userResult] = await connection.execute(
        'INSERT INTO users (full_name, email, phone, password_hash, role, email_verified_at, must_change_password, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          user.fullName,
          user.email,
          user.phone || null,
          user.passwordHash,
          'STAFF',
          user.emailVerifiedAt || null,
          user.mustChangePassword !== undefined ? user.mustChangePassword : true,
          user.status || 'ACTIVE'
        ]
      );

      const userId = userResult.insertId;

      await connection.execute(
        'INSERT INTO staff_profiles (user_id, specialization, experience_years, bio, profile_image_url, status) VALUES (?, ?, ?, ?, ?, ?)',
        [
          userId,
          profile.specialization || null,
          profile.experienceYears || 0,
          profile.bio || null,
          profile.profileImageUrl || null,
          profile.status || 'ACTIVE'
        ]
      );

      await connection.commit();
      return { id: userId, ...user, role: 'STAFF' };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Create a generic user (e.g. Admin or Cashier)
   * @param {Object} user 
   * @returns {Object}
   */
  async createUser(user) {
    const [result] = await pool.execute(
      'INSERT INTO users (full_name, email, phone, password_hash, role, email_verified_at, must_change_password, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        user.fullName,
        user.email,
        user.phone || null,
        user.passwordHash,
        user.role,
        user.emailVerifiedAt || null,
        user.mustChangePassword !== undefined ? user.mustChangePassword : false,
        user.status || 'ACTIVE'
      ]
    );
    return { id: result.insertId, ...user };
  },

  /**
   * Update a user's basic details and profile
   * @param {Number} id 
   * @param {Object} userUpdates 
   * @param {Object} profileUpdates 
   */
  async update(id, userUpdates, profileUpdates = null) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Update basic user properties
      if (Object.keys(userUpdates).length > 0) {
        const fields = [];
        const values = [];
        for (const [key, val] of Object.entries(userUpdates)) {
          fields.push(`${key} = ?`);
          values.push(val);
        }
        values.push(id);
        await connection.execute(
          `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
          values
        );
      }

      // Update profile depending on role
      if (profileUpdates) {
        const [userRow] = await connection.execute('SELECT role FROM users WHERE id = ?', [id]);
        if (userRow[0]) {
          const role = userRow[0].role;
          if (role === 'CUSTOMER') {
            const fields = [];
            const values = [];
            for (const [key, val] of Object.entries(profileUpdates)) {
              fields.push(`${key} = ?`);
              values.push(val);
            }
            values.push(id);
            await connection.execute(
              `UPDATE customer_profiles SET ${fields.join(', ')} WHERE user_id = ?`,
              values
            );
          } else if (role === 'STAFF') {
            const fields = [];
            const values = [];
            for (const [key, val] of Object.entries(profileUpdates)) {
              fields.push(`${key} = ?`);
              values.push(val);
            }
            values.push(id);
            await connection.execute(
              `UPDATE staff_profiles SET ${fields.join(', ')} WHERE user_id = ?`,
              values
            );
          }
        }
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
   * Update user status (ACTIVE, INACTIVE, SUSPENDED)
   * @param {Number} id 
   * @param {String} status 
   */
  async updateStatus(id, status) {
    await pool.execute(
      'UPDATE users SET status = ? WHERE id = ?',
      [status, id]
    );
  },

  /**
   * Update user password
   * @param {Number} id 
   * @param {String} passwordHash 
   * @param {Boolean} mustChangePassword 
   */
  async updatePassword(id, passwordHash, mustChangePassword = false) {
    await pool.execute(
      'UPDATE users SET password_hash = ?, must_change_password = ? WHERE id = ?',
      [passwordHash, mustChangePassword, id]
    );
  },

  /**
   * Soft delete a user
   * @param {Number} id 
   */
  async delete(id) {
    await pool.execute(
      'UPDATE users SET deleted_at = NOW() WHERE id = ?',
      [id]
    );
  },

  /**
   * Get a list of users filtered by role, status, search query, with pagination
   * @param {Object} filters 
   * @returns {Object} { users, total }
   */
  async listAll({ role, status, search, limit = 10, offset = 0 } = {}) {
    let query = 'SELECT id, full_name, email, phone, role, email_verified_at, must_change_password, status, created_at FROM users WHERE deleted_at IS NULL';
    const params = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (full_name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Clone query for count
    const countQuery = `SELECT COUNT(*) as count FROM (${query}) as t`;
    const [countRows] = await pool.execute(countQuery, params);
    const total = countRows[0].count;

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const [users] = await pool.query(query, params);

    return { users, total };
  }
};

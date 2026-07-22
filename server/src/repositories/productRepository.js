import { pool } from '../config/database.js';

export const productRepository = {
  /**
   * List all products with optional filters
   */
  async listAll({ category, status = 'ACTIVE' } = {}) {
    let query = 'SELECT * FROM products WHERE deleted_at IS NULL';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY name ASC';
    const [rows] = await pool.execute(query, params);
    return rows;
  },

  /**
   * Find product by ID
   */
  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM products WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Update product stock
   */
  async updateStock(id, quantityDiff, connection = null) {
    const db = connection || pool;
    await db.execute(
      'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
      [quantityDiff, id]
    );
  }
};

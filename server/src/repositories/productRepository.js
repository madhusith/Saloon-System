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
   * Find product by SKU code
   */
  async findBySku(sku) {
    const [rows] = await pool.execute(
      'SELECT * FROM products WHERE sku = ? AND deleted_at IS NULL',
      [sku]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Create a new catalog product
   */
  async create(productData) {
    const { sku, name, description, category, costPrice, sellingPrice, stockQuantity, reorderLevel } = productData;
    const [result] = await pool.execute(
      `INSERT INTO products (
        sku, name, description, category, cost_price, selling_price, stock_quantity, reorder_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [sku, name, description, category, costPrice, sellingPrice, stockQuantity, reorderLevel]
    );
    return { id: result.insertId, ...productData };
  },

  /**
   * Update catalog details
   */
  async update(id, productData) {
    const fields = [];
    const params = [];

    // Map camelCase keys to database column names
    const mappings = {
      name: 'name',
      description: 'description',
      category: 'category',
      costPrice: 'cost_price',
      sellingPrice: 'selling_price',
      reorderLevel: 'reorder_level',
      status: 'status'
    };

    for (const [key, val] of Object.entries(productData)) {
      if (mappings[key] !== undefined && val !== undefined) {
        fields.push(`${mappings[key]} = ?`);
        params.push(val);
      }
    }

    if (fields.length === 0) return;

    params.push(id);
    await pool.execute(
      `UPDATE products SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
      params
    );
  },

  /**
   * Soft-delete/deactivate product catalog item
   */
  async delete(id) {
    await pool.execute(
      'UPDATE products SET deleted_at = NOW(), status = "INACTIVE" WHERE id = ?',
      [id]
    );
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

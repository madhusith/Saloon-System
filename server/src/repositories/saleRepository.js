import { pool } from '../config/database.js';

export const saleRepository = {
  /**
   * List all sales with pagination, ordering, and filters
   */
  async listAll({ date, saleType, customerId, limit = 10, offset = 0 } = {}) {
    let query = `
      SELECT s.*, 
             u_cust.full_name AS customer_name,
             u_cash.full_name AS cashier_name
      FROM sales s
      LEFT JOIN users u_cust ON s.customer_id = u_cust.id
      INNER JOIN users u_cash ON s.cashier_id = u_cash.id
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      query += ' AND DATE(s.created_at) = ?';
      params.push(date);
    }

    if (saleType) {
      query += ' AND s.sale_type = ?';
      params.push(saleType);
    }

    if (customerId) {
      query += ' AND s.customer_id = ?';
      params.push(Number(customerId));
    }

    // Get count
    const countQuery = `SELECT COUNT(*) as count FROM (${query}) as t`;
    const [countRows] = await pool.query(countQuery, params);
    const total = countRows[0].count;

    // Add ordering and limits
    query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const [sales] = await pool.query(query, params);
    return { sales, total };
  },

  /**
   * Fetch individual sale/invoice details including line items and payment logs
   */
  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT s.*, 
              u_cust.full_name AS customer_name, u_cust.email AS customer_email, u_cust.phone AS customer_phone,
              u_cash.full_name AS cashier_name
       FROM sales s
       LEFT JOIN users u_cust ON s.customer_id = u_cust.id
       INNER JOIN users u_cash ON s.cashier_id = u_cash.id
       WHERE s.id = ?`,
      [id]
    );

    if (rows.length === 0) return null;
    const sale = rows[0];

    // Load related items
    const [items] = await pool.execute(
      `SELECT si.* 
       FROM sale_items si
       WHERE si.sale_id = ?`,
      [id]
    );

    // Load related payment method & transaction info
    const [payments] = await pool.execute(
      `SELECT p.payment_method, p.transaction_reference, p.gateway_name, p.paid_at
       FROM payments p
       WHERE p.sale_id = ?`,
      [id]
    );

    sale.items = items;
    sale.payments = payments;
    return sale;
  }
};

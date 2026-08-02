import { pool } from '../config/database.js';

export const orderRepository = {
  /**
   * Create a new online product order within a transaction
   */
  async create(orderData, connection = null) {
    const db = connection || pool;
    const {
      orderReference,
      customerId,
      subtotal,
      discountAmount,
      totalAmount,
      paymentStatus,
      orderStatus,
      pickupDate,
      customerNote,
      items
    } = orderData;

    // 1. Insert order record
    const [orderResult] = await db.execute(
      `INSERT INTO orders (
        order_reference, customer_id, subtotal, discount_amount, total_amount, 
        payment_status, order_status, pickup_date, customer_note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderReference,
        customerId,
        subtotal,
        discountAmount || 0,
        totalAmount,
        paymentStatus,
        orderStatus,
        pickupDate,
        customerNote || null
      ]
    );

    const orderId = orderResult.insertId;

    // 2. Insert order items
    for (const item of items) {
      await db.execute(
        `INSERT INTO order_items (
          order_id, product_id, product_name_snapshot, quantity, unit_price, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.productId,
          item.productNameSnapshot,
          item.quantity,
          item.unitPrice,
          item.subtotal
        ]
      );
    }

    return { id: orderId, ...orderData };
  },

  /**
   * Find order by ID (with its items)
   */
  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT o.*, u.full_name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
       FROM orders o
       INNER JOIN users u ON o.customer_id = u.id
       WHERE o.id = ?`,
      [id]
    );

    if (rows.length === 0) return null;
    const order = rows[0];

    const [items] = await pool.execute(
      `SELECT oi.*, p.sku AS product_sku
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [id]
    );

    const [payments] = await pool.execute(
      `SELECT p.payment_method, p.transaction_reference, p.gateway_name, p.paid_at
       FROM payments p
       WHERE p.order_id = ?`,
      [id]
    );

    order.items = items;
    order.payments = payments;
    return order;
  },

  /**
   * Find order by reference code
   */
  async findByReference(orderReference) {
    const [rows] = await pool.execute(
      `SELECT id FROM orders WHERE order_reference = ?`,
      [orderReference]
    );
    return rows.length > 0 ? this.findById(rows[0].id) : null;
  },

  /**
   * List orders with pagination and status filters
   */
  async listAll({ status, customerId, limit = 10, offset = 0 } = {}) {
    let query = `
      SELECT o.*, u.full_name AS customer_name, u.email AS customer_email
      FROM orders o
      INNER JOIN users u ON o.customer_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND o.order_status = ?';
      params.push(status);
    }

    if (customerId) {
      query += ' AND o.customer_id = ?';
      params.push(Number(customerId));
    }

    // Get count
    const countQuery = `SELECT COUNT(*) as count FROM (${query}) as t`;
    const [countRows] = await pool.query(countQuery, params);
    const total = countRows[0].count;

    // Add pagination
    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const [orders] = await pool.query(query, params);
    return { orders, total };
  },

  /**
   * Update order and payment status
   */
  async updateStatus(id, { orderStatus, paymentStatus }, connection = null) {
    const db = connection || pool;
    const fields = [];
    const params = [];

    if (orderStatus) {
      fields.push('order_status = ?');
      params.push(orderStatus);
    }

    if (paymentStatus) {
      fields.push('payment_status = ?');
      params.push(paymentStatus);
    }

    if (fields.length === 0) return;

    params.push(id);
    await db.execute(
      `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
  }
};

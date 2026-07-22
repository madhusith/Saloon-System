import { pool } from '../config/database.js';

export const posRepository = {
  /**
   * Run POS Checkout within a single MySQL transaction
   */
  async checkout(checkoutData) {
    const {
      invoiceNumber,
      cashierId,
      customerId,
      appointmentId,
      saleType,
      subtotal,
      discountAmount,
      totalAmount,
      paymentMethod,
      transactionReference,
      items,
      discountApproval
    } = checkoutData;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Create the sale record
      const [saleResult] = await connection.execute(
        `INSERT INTO sales (
          invoice_number, cashier_id, customer_id, appointment_id, 
          sale_type, subtotal, discount_amount, total_amount, payment_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PAID')`,
        [
          invoiceNumber,
          cashierId,
          customerId || null,
          appointmentId || null,
          saleType,
          subtotal,
          discountAmount || 0,
          totalAmount,
        ]
      );

      const saleId = saleResult.insertId;

      // 2. Insert items and update stock for product items
      for (const item of items) {
        await connection.execute(
          `INSERT INTO sale_items (
            sale_id, item_type, product_id, service_id, 
            item_name_snapshot, quantity, unit_price, subtotal
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            saleId,
            item.itemType,
            item.itemType === 'PRODUCT' ? item.productId : null,
            item.itemType === 'SERVICE' ? item.serviceId : null,
            item.itemNameSnapshot,
            item.quantity,
            item.unitPrice,
            item.subtotal
          ]
        );

        // If it's a product, reduce the inventory stock
        if (item.itemType === 'PRODUCT' && item.productId) {
          // Verify stock first
          const [prodRows] = await connection.execute(
            'SELECT stock_quantity, name FROM products WHERE id = ? FOR UPDATE',
            [item.productId]
          );
          if (prodRows.length === 0) {
            throw new Error(`Product ID ${item.productId} not found.`);
          }
          const currentStock = prodRows[0].stock_quantity;
          if (currentStock < item.quantity) {
            throw new Error(`Insufficient stock for product: ${prodRows[0].name}. (Available: ${currentStock}, Requested: ${item.quantity})`);
          }

          // Decrement stock
          await connection.execute(
            'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
            [item.quantity, item.productId]
          );
        }
      }

      // 3. Create the payment record
      const [payResult] = await connection.execute(
        `INSERT INTO payments (
          customer_id, appointment_id, sale_id, payment_method, 
          amount, transaction_reference, payment_status, recorded_by, paid_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'PAID', ?, NOW())`,
        [
          customerId || null,
          appointmentId || null,
          saleId,
          paymentMethod,
          totalAmount,
          transactionReference || null,
          cashierId
        ]
      );

      const paymentId = payResult.insertId;

      // 4. Update appointment status to COMPLETED if applicable
      if (appointmentId) {
        await connection.execute(
          `UPDATE appointments 
           SET status = 'COMPLETED', payment_status = 'PAID' 
           WHERE id = ?`,
          [appointmentId]
        );
      }

      // 5. Create discount approval logging if needed
      if (discountApproval && discountAmount > 0) {
        await connection.execute(
          `INSERT INTO discount_approvals (
            sale_id, requested_by, approved_by, discount_percentage, status, reason
          ) VALUES (?, ?, ?, ?, 'APPROVED', ?)`,
          [
            saleId,
            cashierId,
            discountApproval.approvedBy || null,
            discountApproval.discountPercentage,
            discountApproval.reason || 'Cashier Limit / Admin Override'
          ]
        );
      }

      await connection.commit();
      return { saleId, invoiceNumber, paymentId };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
};

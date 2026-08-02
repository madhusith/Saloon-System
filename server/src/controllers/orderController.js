import { orderRepository } from '../repositories/orderRepository.js';
import { productRepository } from '../repositories/productRepository.js';
import { inventoryRepository } from '../repositories/inventoryRepository.js';
import { pool } from '../config/database.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';
import { emitEvent } from '../sockets/socket.js';
import { emailService } from '../services/emailService.js';
import { logAudit } from '../services/auditService.js';

export const orderController = {
  /**
   * Place a new online product order (Customer only)
   */
  async createOrder(req, res, next) {
    const { pickupDate, customerNote, paymentMethod, cardDetails, items } = req.body;
    const customerId = req.user.id;

    // Check that pickup date is at least today (start of day in local time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pickup = new Date(pickupDate);
    if (pickup < today) {
      return next(new AppError('Pickup date cannot be in the past.', 400));
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      let subtotal = 0;
      const orderItemsToCreate = [];

      // 1. Lock rows and check stock availability for all items
      for (const item of items) {
        const [prodRows] = await connection.execute(
          'SELECT id, name, cost_price, selling_price, stock_quantity, reorder_level FROM products WHERE id = ? AND deleted_at IS NULL FOR UPDATE',
          [item.productId]
        );

        if (prodRows.length === 0) {
          throw new AppError(`Product ID ${item.productId} was not found in catalog.`, 404);
        }

        const product = prodRows[0];
        if (product.stock_quantity < item.quantity) {
          throw new AppError(`Insufficient stock for product: ${product.name}. (Available: ${product.stock_quantity}, Requested: ${item.quantity})`, 400);
        }

        const itemSubtotal = Number(product.selling_price) * item.quantity;
        subtotal += itemSubtotal;

        orderItemsToCreate.push({
          productId: product.id,
          productNameSnapshot: product.name,
          quantity: item.quantity,
          unitPrice: Number(product.selling_price),
          subtotal: itemSubtotal,
          stockBefore: product.stock_quantity
        });
      }

      // Generate order reference
      const datePrefix = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const hexRandom = Math.random().toString(16).substring(2, 6).toUpperCase();
      const orderReference = `ORD-${datePrefix}-${hexRandom}`;
      const totalAmount = subtotal; // No discount in online orders currently

      // 2. Insert order record
      const [orderResult] = await connection.execute(
        `INSERT INTO orders (
          order_reference, customer_id, subtotal, discount_amount, total_amount, 
          payment_status, order_status, pickup_date, customer_note
        ) VALUES (?, ?, ?, 0.00, ?, 'PAID', 'PAID', ?, ?)`,
        [
          orderReference,
          customerId,
          subtotal,
          totalAmount,
          pickupDate,
          customerNote || null
        ]
      );

      const orderId = orderResult.insertId;

      // 3. Deduct stock, create order items & log stock movements
      for (const item of orderItemsToCreate) {
        // Insert item
        await connection.execute(
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

        const stockAfter = item.stockBefore - item.quantity;

        // Decrement stock
        await connection.execute(
          'UPDATE products SET stock_quantity = ? WHERE id = ?',
          [stockAfter, item.productId]
        );

        // Log stock movement
        await inventoryRepository.logMovement({
          productId: item.productId,
          movementType: 'ONLINE_ORDER',
          quantity: -item.quantity,
          stockBefore: item.stockBefore,
          stockAfter: stockAfter,
          referenceType: 'ORDER',
          referenceId: orderId,
          note: `Online Order Checkout - Ref: ${orderReference}`,
          createdBy: customerId
        }, connection);
      }

      // 4. Create mock payment record
      const transactionReference = `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      await connection.execute(
        `INSERT INTO payments (
          customer_id, order_id, payment_method, amount, currency, 
          transaction_reference, gateway_name, payment_status, recorded_by, paid_at
        ) VALUES (?, ?, 'ONLINE', ?, 'LKR', ?, 'MOCK_GATEWAY', 'PAID', ?, NOW())`,
        [customerId, orderId, totalAmount, transactionReference, customerId]
      );

      await connection.commit();

      // Retrieve full order details to send in email confirmation
      const order = await orderRepository.findById(orderId);

      // Log audit trail
      await logAudit({
        userId: customerId,
        action: 'ONLINE_ORDER_PLACED',
        entityType: 'orders',
        entityId: orderId,
        newValuesJson: { orderReference, totalAmount, paymentMethod },
        ipAddress: req.ip
      });

      // Send email notifications (async)
      emailService.sendOrderPlacedEmail(req.user, order).catch(err => {
        console.error('Failed to send order placed email:', err);
      });

      // Emit socket notification
      emitEvent('order:created', { orderId, orderReference });

      return sendSuccess(res, {
        message: 'Online order placed successfully.',
        statusCode: 201,
        data: {
          orderId,
          orderReference,
          totalAmount
        }
      });

    } catch (error) {
      await connection.rollback();
      return next(error);
    } finally {
      connection.release();
    }
  },

  /**
   * Get authenticated customer's order history
   */
  async getCustomerOrders(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const { orders, total } = await orderRepository.listAll({
        customerId: req.user.id,
        limit,
        offset
      });

      return sendSuccess(res, {
        message: 'Order history retrieved successfully.',
        data: {
          orders,
          meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Get single order details
   */
  async getOrderDetails(req, res, next) {
    try {
      const { id } = req.params;
      const order = await orderRepository.findById(id);

      if (!order) {
        return next(new AppError('Order not found.', 404));
      }

      // Check authorization: Customer can only view their own orders
      if (req.user.role === 'CUSTOMER' && order.customer_id !== req.user.id) {
        return next(new AppError('Unauthorized: Cannot view another customer\'s order details.', 403));
      }

      return sendSuccess(res, {
        message: 'Order details retrieved successfully.',
        data: { order }
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Admin/Cashier list all salon orders
   */
  async listOrders(req, res, next) {
    try {
      if (req.user.role !== 'ADMIN' && req.user.role !== 'CASHIER') {
        return next(new AppError('Unauthorized to access order lists.', 403));
      }

      const { status, customerId, page = 1, limit = 10 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const { orders, total } = await orderRepository.listAll({
        status,
        customerId,
        limit,
        offset
      });

      return sendSuccess(res, {
        message: 'Orders retrieved successfully.',
        data: {
          orders,
          meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Admin/Cashier update order status
   */
  async updateOrderStatus(req, res, next) {
    const { id } = req.params;
    const { orderStatus, paymentStatus } = req.body;
    const adminId = req.user.id;

    if (req.user.role !== 'ADMIN' && req.user.role !== 'CASHIER') {
      return next(new AppError('Unauthorized to modify order status.', 403));
    }

    const order = await orderRepository.findById(id);
    if (!order) {
      return next(new AppError('Order not found.', 404));
    }

    if (order.order_status === 'CANCELLED' || order.order_status === 'COMPLETED') {
      return next(new AppError(`Cannot modify order once it is ${order.order_status}.`, 400));
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      if (orderStatus === 'CANCELLED') {
        // Restore stock and log cancellation
        for (const item of order.items) {
          if (item.product_id) {
            const [prodRows] = await connection.execute(
              'SELECT stock_quantity FROM products WHERE id = ? FOR UPDATE',
              [item.product_id]
            );
            const currentStock = prodRows[0]?.stock_quantity || 0;
            const newStock = currentStock + item.quantity;

            await connection.execute(
              'UPDATE products SET stock_quantity = ? WHERE id = ?',
              [newStock, item.product_id]
            );

            await inventoryRepository.logMovement({
              productId: item.product_id,
              movementType: 'ORDER_CANCELLATION',
              quantity: item.quantity,
              stockBefore: currentStock,
              stockAfter: newStock,
              referenceType: 'ORDER',
              referenceId: id,
              note: `Admin/Cashier Cancelled Order - Ref: ${order.order_reference}`,
              createdBy: adminId
            }, connection);
          }
        }

        // Set order as cancelled and refund payment
        await orderRepository.updateStatus(id, {
          orderStatus: 'CANCELLED',
          paymentStatus: 'REFUNDED'
        }, connection);

        // Update payment table entry status
        await connection.execute(
          "UPDATE payments SET payment_status = 'REFUNDED' WHERE order_id = ?",
          [id]
        );
      } else {
        await orderRepository.updateStatus(id, {
          orderStatus,
          paymentStatus
        }, connection);
      }

      await connection.commit();

      // Log audit
      await logAudit({
        userId: adminId,
        action: 'ORDER_STATUS_UPDATED',
        entityType: 'orders',
        entityId: id,
        newValuesJson: { orderStatus, paymentStatus },
        ipAddress: req.ip
      });

      // Send status notifications (async)
      const customer = { id: order.customer_id, fullName: order.customer_name, email: order.customer_email };
      const updatedOrder = await orderRepository.findById(id);

      if (orderStatus === 'CANCELLED') {
        emailService.sendOrderCancelledEmail(customer, updatedOrder).catch(err => console.error(err));
      } else if (orderStatus === 'READY') {
        emailService.sendOrderReadyEmail(customer, updatedOrder).catch(err => console.error(err));
      } else if (orderStatus === 'COMPLETED') {
        emailService.sendOrderCompletedEmail(customer, updatedOrder).catch(err => console.error(err));
      }

      emitEvent('order:status-changed', { orderId: id, orderStatus });

      return sendSuccess(res, {
        message: `Order status updated to ${orderStatus} successfully.`,
        data: { order: updatedOrder }
      });

    } catch (error) {
      await connection.rollback();
      return next(error);
    } finally {
      connection.release();
    }
  },

  /**
   * Customer cancel their own order (if still pending/paid and not processing/ready)
   */
  async cancelOrder(req, res, next) {
    const { id } = req.params;
    const customerId = req.user.id;

    const order = await orderRepository.findById(id);
    if (!order) {
      return next(new AppError('Order not found.', 404));
    }

    if (order.customer_id !== customerId) {
      return next(new AppError('Unauthorized to cancel this order.', 403));
    }

    if (order.order_status !== 'PAID' && order.order_status !== 'PENDING') {
      return next(new AppError(`Cannot cancel order after it starts processing. Current status: ${order.order_status}. Please contact salon.`, 400));
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Restore stock and log cancellation
      for (const item of order.items) {
        if (item.product_id) {
          const [prodRows] = await connection.execute(
            'SELECT stock_quantity FROM products WHERE id = ? FOR UPDATE',
            [item.product_id]
          );
          const currentStock = prodRows[0]?.stock_quantity || 0;
          const newStock = currentStock + item.quantity;

          await connection.execute(
            'UPDATE products SET stock_quantity = ? WHERE id = ?',
            [newStock, item.product_id]
          );

          await inventoryRepository.logMovement({
            productId: item.product_id,
            movementType: 'ORDER_CANCELLATION',
            quantity: item.quantity,
            stockBefore: currentStock,
            stockAfter: newStock,
            referenceType: 'ORDER',
            referenceId: id,
            note: `Customer Cancelled Order - Ref: ${order.order_reference}`,
            createdBy: customerId
          }, connection);
        }
      }

      // Update statuses
      await orderRepository.updateStatus(id, {
        orderStatus: 'CANCELLED',
        paymentStatus: 'REFUNDED'
      }, connection);

      await connection.execute(
        "UPDATE payments SET payment_status = 'REFUNDED' WHERE order_id = ?",
        [id]
      );

      await connection.commit();

      // Log audit
      await logAudit({
        userId: customerId,
        action: 'CUSTOMER_ORDER_CANCELLED',
        entityType: 'orders',
        entityId: id,
        newValuesJson: { orderReference: order.order_reference },
        ipAddress: req.ip
      });

      // Send email (async)
      const customer = { id: customerId, fullName: order.customer_name, email: order.customer_email };
      const updatedOrder = await orderRepository.findById(id);
      emailService.sendOrderCancelledEmail(customer, updatedOrder).catch(err => console.error(err));

      emitEvent('order:status-changed', { orderId: id, orderStatus: 'CANCELLED' });

      return sendSuccess(res, {
        message: 'Order cancelled successfully.',
        data: { order: updatedOrder }
      });

    } catch (error) {
      await connection.rollback();
      return next(error);
    } finally {
      connection.release();
    }
  }
};

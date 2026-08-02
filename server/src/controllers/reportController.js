import { pool } from '../config/database.js';
import { auditRepository } from '../repositories/auditRepository.js';
import { notificationRepository } from '../repositories/notificationRepository.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';

export const reportController = {
  /**
   * Get top-level dashboard metrics for the Admin dashboard (Admin only)
   */
  async getDashboardStats(req, res, next) {
    if (req.user.role !== 'ADMIN') {
      return next(new AppError('Unauthorized: Admin access required.', 403));
    }

    try {
      // Query 1: Today's sales revenue
      const [revRows] = await pool.query(
        "SELECT SUM(total_amount) AS total FROM sales WHERE DATE(created_at) = CURDATE() AND payment_status = 'PAID'"
      );
      const todayRevenue = Number(revRows[0]?.total || 0);

      // Query 2: Today's appointments count
      const [apptRows] = await pool.query(
        "SELECT COUNT(*) AS count FROM appointments WHERE appointment_date = CURDATE() AND status != 'CANCELLED'"
      );
      const todayAppointments = apptRows[0]?.count || 0;

      // Query 3: Today's queue checked-in sessions (WAITING, IN_PROGRESS, COMPLETED)
      const [queueRows] = await pool.query(
        "SELECT COUNT(*) AS count FROM appointments WHERE appointment_date = CURDATE() AND status IN ('WAITING', 'IN_PROGRESS', 'COMPLETED')"
      );
      const queueCheckedIn = queueRows[0]?.count || 0;

      // Query 4: Active low stock products count
      const [stockRows] = await pool.query(
        "SELECT COUNT(*) AS count FROM products WHERE deleted_at IS NULL AND status = 'ACTIVE' AND stock_quantity <= reorder_level"
      );
      const lowStockCount = stockRows[0]?.count || 0;

      // Query 5: Total active customers count
      const [custRows] = await pool.query(
        "SELECT COUNT(*) AS count FROM users WHERE role = 'CUSTOMER' AND status = 'ACTIVE' AND deleted_at IS NULL"
      );
      const activeCustomers = custRows[0]?.count || 0;

      return sendSuccess(res, {
        message: 'Dashboard metrics retrieved successfully.',
        data: {
          todayRevenue,
          todayAppointments,
          queueCheckedIn,
          lowStockCount,
          activeCustomers
        }
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Get revenue history aggregated by day for the past 30 days (Admin only)
   */
  async getRevenueReport(req, res, next) {
    if (req.user.role !== 'ADMIN') {
      return next(new AppError('Unauthorized: Admin access required.', 403));
    }

    try {
      // Group sales by date for past 30 days
      const [rows] = await pool.query(
        `SELECT DATE(created_at) AS date, 
                SUM(CASE WHEN payment_method = 'CASH' THEN amount ELSE 0 END) AS cash_revenue,
                SUM(CASE WHEN payment_method = 'CARD' THEN amount ELSE 0 END) AS card_revenue,
                SUM(CASE WHEN payment_method = 'ONLINE' THEN amount ELSE 0 END) AS online_revenue,
                SUM(amount) AS total_revenue
         FROM payments
         WHERE payment_status = 'PAID' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
         GROUP BY DATE(created_at)
         ORDER BY date ASC`
      );

      // Map dates to local date strings for easier UI graphing
      const formatted = rows.map(r => ({
        date: new Date(r.date).toISOString().split('T')[0],
        cash: Number(r.cash_revenue),
        card: Number(r.card_revenue),
        online: Number(r.online_revenue),
        total: Number(r.total_revenue)
      }));

      return sendSuccess(res, {
        message: 'Revenue historical report compiled.',
        data: { revenue: formatted }
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Get service popularity statistics (Admin only)
   */
  async getServiceReport(req, res, next) {
    if (req.user.role !== 'ADMIN') {
      return next(new AppError('Unauthorized: Admin access required.', 403));
    }

    try {
      const [rows] = await pool.query(
        `SELECT item_name_snapshot AS service_name, 
                COUNT(*) AS booking_count, 
                SUM(unit_price * quantity) AS total_revenue
         FROM sale_items
         WHERE item_type = 'SERVICE'
         GROUP BY item_name_snapshot
         ORDER BY booking_count DESC`
      );

      const services = rows.map(r => ({
        name: r.service_name,
        count: Number(r.booking_count),
        revenue: Number(r.total_revenue)
      }));

      return sendSuccess(res, {
        message: 'Service popularity report compiled.',
        data: { services }
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Get product sales volume and catalog revenue statistics (Admin only)
   */
  async getProductReport(req, res, next) {
    if (req.user.role !== 'ADMIN') {
      return next(new AppError('Unauthorized: Admin access required.', 403));
    }

    try {
      const [rows] = await pool.query(
        `SELECT item_name_snapshot AS product_name, 
                SUM(quantity) AS quantity_sold, 
                SUM(subtotal) AS total_revenue
         FROM sale_items
         WHERE item_type = 'PRODUCT'
         GROUP BY item_name_snapshot
         ORDER BY quantity_sold DESC`
      );

      const products = rows.map(r => ({
        name: r.product_name,
        qtySold: Number(r.quantity_sold),
        revenue: Number(r.total_revenue)
      }));

      return sendSuccess(res, {
        message: 'Product sales report compiled.',
        data: { products }
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Get staff workload and booking statistics (Admin only)
   */
  async getStaffReport(req, res, next) {
    if (req.user.role !== 'ADMIN') {
      return next(new AppError('Unauthorized: Admin access required.', 403));
    }

    try {
      const [rows] = await pool.query(
        `SELECT u.full_name AS staff_name, 
                COUNT(a.id) AS total_appointments, 
                SUM(CASE WHEN a.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_count,
                SUM(CASE WHEN a.status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_count
         FROM appointments a
         INNER JOIN users u ON a.staff_id = u.id
         GROUP BY a.staff_id, u.full_name
         ORDER BY total_appointments DESC`
      );

      const staff = rows.map(r => ({
        name: r.staff_name,
        total: Number(r.total_appointments),
        completed: Number(r.completed_count),
        cancelled: Number(r.cancelled_count)
      }));

      return sendSuccess(res, {
        message: 'Staff performance report compiled.',
        data: { staff }
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * List paginated administrative audit logs history (Admin only)
   */
  async getAuditLogs(req, res, next) {
    if (req.user.role !== 'ADMIN') {
      return next(new AppError('Unauthorized: Admin access required.', 403));
    }

    try {
      const { page = 1, limit = 20, userId, action } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const { logs, total } = await auditRepository.listAll({
        userId,
        action,
        limit,
        offset
      });

      return sendSuccess(res, {
        message: 'Audit logs retrieved successfully.',
        data: {
          logs,
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
   * List paginated email alerts delivery notification logs (Admin only)
   */
  async getNotificationLogs(req, res, next) {
    if (req.user.role !== 'ADMIN') {
      return next(new AppError('Unauthorized: Admin access required.', 403));
    }

    try {
      const { page = 1, limit = 20, recipientEmail, status } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const { notifications, total } = await notificationRepository.listAll({
        recipientEmail,
        status,
        limit,
        offset
      });

      return sendSuccess(res, {
        message: 'Email notification logs retrieved successfully.',
        data: {
          notifications,
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
  }
};

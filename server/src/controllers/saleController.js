import { saleRepository } from '../repositories/saleRepository.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';

export const saleController = {
  /**
   * List POS Sales / Invoices
   */
  async listSales(req, res, next) {
    try {
      const { date, saleType, customerId, page = 1, limit = 10 } = req.query;

      // Authorization check: Cashier or Admin or Customer viewing their own sales
      let filterCustomerId = customerId;
      if (req.user.role === 'CUSTOMER') {
        filterCustomerId = req.user.id;
      } else if (req.user.role !== 'CASHIER' && req.user.role !== 'ADMIN') {
        return next(new AppError('Unauthorized to view sales history.', 403));
      }

      const offset = (Number(page) - 1) * Number(limit);
      const { sales, total } = await saleRepository.listAll({
        date,
        saleType,
        customerId: filterCustomerId,
        limit,
        offset
      });

      return sendSuccess(res, {
        message: 'Sales log retrieved successfully.',
        data: {
          sales,
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
   * Fetch invoice detail
   */
  async getSaleDetails(req, res, next) {
    try {
      const { id } = req.params;
      const sale = await saleRepository.findById(id);
      if (!sale) {
        return next(new AppError('Invoice not found.', 404));
      }

      // Authorization checks: Customer can only view their own invoice
      if (req.user.role === 'CUSTOMER' && sale.customer_id !== req.user.id) {
        return next(new AppError('Unauthorized to view this invoice.', 403));
      }

      return sendSuccess(res, {
        message: 'Invoice details retrieved successfully.',
        data: { sale }
      });
    } catch (error) {
      return next(error);
    }
  }
};

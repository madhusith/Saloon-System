import { inventoryRepository } from '../repositories/inventoryRepository.js';
import { productRepository } from '../repositories/productRepository.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';

export const inventoryController = {
    /**
     * Get filtered stock movements history logs (Admin/Cashier only)
     */
    async getStockMovements(req, res, next) {
        const { productId, movementType, page = 1, limit = 10 } = req.query;

        if (req.user.role !== 'ADMIN' && req.user.role !== 'CASHIER') {
            return next(new AppError('Unauthorized: Only cashiers and administrators can view stock logs.', 403));
        }

        try {
            const offset = (Number(page) - 1) * Number(limit);
            const { movements, total } = await inventoryRepository.listMovements({
                productId,
                movementType,
                limit,
                offset
            });

            return sendSuccess(res, {
                message: 'Stock movements retrieved successfully.',
                data: {
                    movements,
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
     * Get products that are equal or below their reorder_level thresholds (Admin only)
     */
    async getLowStockAlerts(req, res, next) {
        if (req.user.role !== 'ADMIN') {
            return next(new AppError('Unauthorized: Only administrators can view stock alert details.', 403));
        }

        try {
            const products = await productRepository.listAll();
            const lowStockProducts = products.filter(
                p => p.status === 'ACTIVE' && p.stock_quantity <= p.reorder_level
            );

            return sendSuccess(res, {
                message: 'Low stock alerts retrieved successfully.',
                data: { products: lowStockProducts }
            });
        } catch (error) {
            return next(error);
        }
    }
};

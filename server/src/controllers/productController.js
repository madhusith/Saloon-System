import { productRepository } from '../repositories/productRepository.js';
import { inventoryRepository } from '../repositories/inventoryRepository.js';
import { pool } from '../config/database.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';

export const productController = {
  /**
   * List products with category/status filters
   */
  async listProducts(req, res, next) {
    try {
      const { category, status } = req.query;
      const products = await productRepository.listAll({ category, status });
      return sendSuccess(res, {
        message: 'Products retrieved successfully.',
        data: { products }
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Get product details
   */
  async getProductDetails(req, res, next) {
    try {
      const { id } = req.params;
      const product = await productRepository.findById(id);
      if (!product) {
        return next(new AppError('Product not found.', 404));
      }
      return sendSuccess(res, {
        message: 'Product retrieved successfully.',
        data: { product }
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Create a new product (Admin only)
   */
  async createProduct(req, res, next) {
    const { sku, name, description, category, costPrice, sellingPrice, stockQuantity, reorderLevel } = req.body;
    const userId = req.user.id;

    if (req.user.role !== 'ADMIN') {
      return next(new AppError('Unauthorized: Only administrators can create products.', 403));
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Check for SKU uniqueness
      const existing = await productRepository.findBySku(sku);
      if (existing) {
        throw new AppError(`A product with SKU "${sku}" already exists.`, 400);
      }

      const product = await productRepository.create({
        sku,
        name,
        description,
        category,
        costPrice,
        sellingPrice,
        stockQuantity,
        reorderLevel
      });

      // Log initial stock movement if quantity > 0
      if (stockQuantity > 0) {
        await inventoryRepository.logMovement({
          productId: product.id,
          movementType: 'STOCK_PURCHASE',
          quantity: stockQuantity,
          stockBefore: 0,
          stockAfter: stockQuantity,
          note: 'Initial stock intake on creation',
          createdBy: userId
        }, connection);
      }

      await connection.commit();
      return sendSuccess(res, {
        message: 'Product created successfully.',
        statusCode: 201,
        data: { product }
      });
    } catch (error) {
      await connection.rollback();
      return next(error);
    } finally {
      connection.release();
    }
  },

  /**
   * Update product catalog details (Admin only)
   */
  async updateProduct(req, res, next) {
    const { id } = req.params;

    if (req.user.role !== 'ADMIN') {
      return next(new AppError('Unauthorized: Only administrators can modify products.', 403));
    }

    try {
      const product = await productRepository.findById(id);
      if (!product) {
        return next(new AppError('Product not found.', 404));
      }

      await productRepository.update(id, req.body);
      const updatedProduct = await productRepository.findById(id);

      return sendSuccess(res, {
        message: 'Product updated successfully.',
        data: { product: updatedProduct }
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Delete product catalog item (Admin only)
   */
  async deleteProduct(req, res, next) {
    const { id } = req.params;

    if (req.user.role !== 'ADMIN') {
      return next(new AppError('Unauthorized: Only administrators can delete products.', 403));
    }

    try {
      const product = await productRepository.findById(id);
      if (!product) {
        return next(new AppError('Product not found.', 404));
      }

      await productRepository.delete(id);
      return sendSuccess(res, {
        message: 'Product deleted successfully.'
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Perform manual stock adjustments (Admin / Cashier with clearance)
   */
  async adjustStock(req, res, next) {
    const { id } = req.params;
    const { quantityDiff, movementType, note } = req.body;
    const userId = req.user.id;

    if (req.user.role !== 'ADMIN' && req.user.role !== 'CASHIER') {
      return next(new AppError('Unauthorized to adjust stock levels.', 403));
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Lock row for update
      const [rows] = await connection.execute(
        'SELECT stock_quantity, name FROM products WHERE id = ? FOR UPDATE',
        [id]
      );

      if (rows.length === 0) {
        throw new AppError('Product not found.', 404);
      }

      const stockBefore = rows[0].stock_quantity;
      const stockAfter = stockBefore + quantityDiff;

      if (stockAfter < 0) {
        throw new AppError(`Adjusting stock by ${quantityDiff} would result in negative inventory for: ${rows[0].name}. (Available: ${stockBefore})`, 400);
      }

      // Update product stock quantity
      await connection.execute(
        'UPDATE products SET stock_quantity = ? WHERE id = ?',
        [stockAfter, id]
      );

      // Log movement in stock_movements
      await inventoryRepository.logMovement({
        productId: id,
        movementType,
        quantity: quantityDiff,
        stockBefore,
        stockAfter,
        note: note || 'Manual administrative adjustments',
        createdBy: userId
      }, connection);

      await connection.commit();
      return sendSuccess(res, {
        message: 'Stock level adjusted successfully.',
        data: {
          productId: Number(id),
          stockBefore,
          stockAfter
        }
      });
    } catch (error) {
      await connection.rollback();
      return next(error);
    } finally {
      connection.release();
    }
  }
};

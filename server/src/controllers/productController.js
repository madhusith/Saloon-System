import { productRepository } from '../repositories/productRepository.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';

export const productController = {
  /**
   * List products
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
  }
};

import { Router } from 'express';
import { productController } from '../controllers/productController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
    createProductSchema,
    updateProductSchema,
    adjustStockSchema
} from '../validators/productValidator.js';

const router = Router();

router.use(authenticate);

router.get('/', productController.listProducts);
router.get('/:id', productController.getProductDetails);

// Administrative Catalog & Stock adjustment endpoints
router.post('/', validate(createProductSchema), productController.createProduct);
router.patch('/:id', validate(updateProductSchema), productController.updateProduct);
router.delete('/:id', productController.deleteProduct);
router.post('/:id/adjust-stock', validate(adjustStockSchema), productController.adjustStock);

export default router;

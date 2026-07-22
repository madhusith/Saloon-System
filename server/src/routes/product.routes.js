import { Router } from 'express';
import { productController } from '../controllers/productController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', productController.listProducts);
router.get('/:id', productController.getProductDetails);

export default router;

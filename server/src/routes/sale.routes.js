import { Router } from 'express';
import { saleController } from '../controllers/saleController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', saleController.listSales);
router.get('/:id', saleController.getSaleDetails);

export default router;

import { Router } from 'express';
import { inventoryController } from '../controllers/inventoryController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/movements', inventoryController.getStockMovements);
router.get('/low-stock', inventoryController.getLowStockAlerts);

export default router;

import { Router } from 'express';
import { reportController } from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Protect all report endpoints; admins only
router.use(authenticate);

router.get('/dashboard', reportController.getDashboardStats);
router.get('/revenue', reportController.getRevenueReport);
router.get('/services', reportController.getServiceReport);
router.get('/products', reportController.getProductReport);
router.get('/staff', reportController.getStaffReport);
router.get('/audit-logs', reportController.getAuditLogs);
router.get('/notifications', reportController.getNotificationLogs);

export default router;

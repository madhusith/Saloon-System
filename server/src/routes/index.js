import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import serviceRoutes from './service.routes.js';
import staffRoutes from './staff.routes.js';
import appointmentRoutes from './appointment.routes.js';
import productRoutes from './product.routes.js';
import posRoutes from './pos.routes.js';
import saleRoutes from './sale.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/services', serviceRoutes);
router.use('/staff', staffRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/products', productRoutes);
router.use('/pos', posRoutes);
router.use('/sales', saleRoutes);

export default router;


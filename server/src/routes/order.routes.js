import { Router } from 'express';
import { orderController } from '../controllers/orderController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createOrderSchema, updateOrderStatusSchema } from '../validators/orderValidator.js';

const router = Router();

router.use(authenticate);

// Customer specific operations
router.post('/', validate(createOrderSchema), orderController.createOrder);
router.get('/my', orderController.getCustomerOrders);
router.post('/:id/cancel', orderController.cancelOrder);

// Detail lookup (both customer and admin/cashier can access, controller checks authorization)
router.get('/:id', orderController.getOrderDetails);

// Administrative order queue management
router.get('/', orderController.listOrders);
router.patch('/:id/status', validate(updateOrderStatusSchema), orderController.updateOrderStatus);

export default router;

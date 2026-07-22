import { Router } from 'express';
import { posController } from '../controllers/posController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { checkoutSchema } from '../validators/posValidator.js';

const router = Router();

router.use(authenticate);

router.post('/checkout', validate(checkoutSchema), posController.checkout);

export default router;

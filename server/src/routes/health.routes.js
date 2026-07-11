import { Router } from 'express';
import { getHealth } from '../controllers/health.controller.js';
import { validate } from '../middleware/validate.js';
import { healthCheckSchema } from '../validators/health.validator.js';

const router = Router();

router.get('/', validate(healthCheckSchema), getHealth);

export default router;


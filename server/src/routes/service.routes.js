import { Router } from 'express';
import { serviceController } from '../controllers/serviceController.js';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createServiceSchema,
  updateServiceSchema,
  serviceIdParamSchema,
  listServicesSchema,
  assignStaffSchema
} from '../validators/serviceValidator.js';

const router = Router();

// Public/authenticated access (any logged-in user can view services)
router.get('/', authenticate, validate(listServicesSchema), serviceController.listServices);
router.get('/:id', authenticate, validate(serviceIdParamSchema), serviceController.getService);

// Admin-only management endpoints
router.post('/', authenticate, authorize('ADMIN'), validate(createServiceSchema), serviceController.createService);
router.patch('/:id', authenticate, authorize('ADMIN'), validate(updateServiceSchema), serviceController.updateService);
router.delete('/:id', authenticate, authorize('ADMIN'), validate(serviceIdParamSchema), serviceController.deleteService);
router.post('/:id/staff', authenticate, authorize('ADMIN'), validate(assignStaffSchema), serviceController.assignStaff);

export default router;

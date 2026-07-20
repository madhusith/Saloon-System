import { Router } from 'express';
import { staffController } from '../controllers/staffController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import {
  updateScheduleSchema,
  addUnavailabilitySchema,
  unavailabilityIdParamSchema,
  staffIdParamSchema
} from '../validators/staffValidator.js';

const router = Router();

// Protect all routes with JWT authentication
router.use(authenticate);

router.get('/', staffController.listStaff);
router.get('/service/:serviceId', staffController.getEligibleStylists);
router.get('/:id/schedule', validate(staffIdParamSchema), staffController.getSchedule);
router.put('/:id/schedule', validate(updateScheduleSchema), staffController.updateSchedule);
router.get('/:id/unavailability', validate(staffIdParamSchema), staffController.getUnavailability);
router.post('/:id/unavailability', validate(addUnavailabilitySchema), staffController.addUnavailability);
router.delete('/:id/unavailability/:slotId', validate(unavailabilityIdParamSchema), staffController.deleteUnavailability);

export default router;

// server/src/routes/appointment.routes.js
import { Router } from 'express';
import { appointmentController } from '../controllers/appointmentController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { updateStatusSchema } from '../validators/appointmentValidator.js';
import {
    bookAppointmentSchema,
    getSlotsSchema,
    appointmentIdParamSchema,
    listAppointmentsSchema
} from '../validators/appointmentValidator.js';


const router = Router();

// Protect all appointment endpoints with JWT authentication
router.use(authenticate);

router.get('/slots', validate(getSlotsSchema), appointmentController.getAvailableSlots);
router.post('/', validate(bookAppointmentSchema), appointmentController.createAppointment);
router.get('/', validate(listAppointmentsSchema), appointmentController.listAppointments);
router.patch('/:id/cancel', validate(appointmentIdParamSchema), appointmentController.cancelAppointment);
router.patch('/:id/status', validate(updateStatusSchema), appointmentController.updateAppointmentStatus);
router.post('/:id/check-in', validate(appointmentIdParamSchema), appointmentController.checkInAppointment);

export default router;

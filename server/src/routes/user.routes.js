import { Router } from 'express';
import { userController } from '../controllers/userController.js';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createUserSchema,
  updateUserSchema,
  updateStatusSchema,
  userIdParamSchema,
  listUsersSchema
} from '../validators/userValidator.js';

const router = Router();

// Secure all endpoints to admin only
router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', validate(listUsersSchema), userController.listUsers);
router.get('/:id', validate(userIdParamSchema), userController.getUser);
router.post('/', validate(createUserSchema), userController.createUser);
router.patch('/:id', validate(updateUserSchema), userController.updateUser);
router.patch('/:id/status', validate(updateStatusSchema), userController.updateStatus);
router.post('/:id/reset-password', validate(userIdParamSchema), userController.resetUserPassword);
router.delete('/:id', validate(userIdParamSchema), userController.deleteUser);

export default router;

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

// Secure all endpoints with authentication
router.use(authenticate);

// Allow Admins and Cashiers to query/lookup users
router.get('/', authorize('ADMIN', 'CASHIER'), validate(listUsersSchema), userController.listUsers);
router.get('/:id', authorize('ADMIN', 'CASHIER'), validate(userIdParamSchema), userController.getUser);

// All other modification actions are strictly ADMIN only (except customer registration by Cashier)
router.post('/', authorize('ADMIN', 'CASHIER'), validate(createUserSchema), userController.createUser);
router.patch('/:id', authorize('ADMIN'), validate(updateUserSchema), userController.updateUser);
router.patch('/:id/status', authorize('ADMIN'), validate(updateStatusSchema), userController.updateStatus);
router.post('/:id/reset-password', authorize('ADMIN'), validate(userIdParamSchema), userController.resetUserPassword);
router.delete('/:id', authorize('ADMIN'), validate(userIdParamSchema), userController.deleteUser);

export default router;

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { userRepository } from '../repositories/userRepository.js';
import { tokenRepository } from '../repositories/tokenRepository.js';
import { emailService } from '../services/emailService.js';
import { logAudit } from '../services/auditService.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const userController = {
  /**
   * List users with pagination and filters
   */
  async listUsers(req, res, next) {
    const { role, status, search, page = 1, limit = 10 } = req.query;

    try {
      const limitNum = Number(limit);
      const offset = (Number(page) - 1) * limitNum;

      const { users, total } = await userRepository.listAll({
        role,
        status,
        search,
        limit: limitNum,
        offset
      });

      return sendSuccess(res, {
        message: 'Users list retrieved.',
        data: {
          users,
          meta: {
            total,
            page: Number(page),
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum)
          }
        }
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Get single user and their profile details
   */
  async getUser(req, res, next) {
    const { id } = req.params;

    try {
      const user = await userRepository.findById(id);
      if (!user) {
        return next(new AppError('User not found.', 404));
      }

      const profile = await userRepository.findProfileByUserId(user.id, user.role);

      return sendSuccess(res, {
        message: 'User details retrieved.',
        data: {
          user,
          profile
        }
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Admin creates a user
   */
  async createUser(req, res, next) {
    const {
      fullName,
      email,
      phone,
      role,
      status = 'ACTIVE',
      specialization,
      experienceYears,
      bio,
      address,
      notes
    } = req.body;

    try {
      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) {
        return next(new AppError('Email is already registered.', 400));
      }

      // Generate a clean temporary password
      const tempPassword = 'Temp_' + crypto.randomBytes(4).toString('hex');
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      let createdUser;

      if (role === 'CUSTOMER') {
        createdUser = await userRepository.createCustomer(
          {
            fullName,
            email,
            phone,
            passwordHash,
            emailVerifiedAt: new Date(),
            status
          },
          { address, notes }
        );
      } else if (role === 'STAFF') {
        createdUser = await userRepository.createStaff(
          {
            fullName,
            email,
            phone,
            passwordHash,
            emailVerifiedAt: new Date(),
            mustChangePassword: true,
            status
          },
          { specialization, experienceYears, bio, status }
        );
      } else {
        // ADMIN or CASHIER
        createdUser = await userRepository.createUser({
          fullName,
          email,
          phone,
          passwordHash,
          role,
          emailVerifiedAt: new Date(),
          mustChangePassword: true,
          status
        });
      }

      // Send welcome email with credentials
      await emailService.sendWelcomeEmail(createdUser, tempPassword);

      await logAudit({
        userId: req.user.id,
        action: 'ADMIN_CREATED_USER',
        entityType: 'users',
        entityId: createdUser.id,
        newValuesJson: { role, email, status },
        ipAddress: req.ip
      });

      return sendSuccess(res, {
        statusCode: 201,
        message: `User created successfully. A welcome email containing the temporary password has been dispatched.`,
        data: {
          user: {
            id: createdUser.id,
            fullName: createdUser.fullName,
            email: createdUser.email,
            role: createdUser.role,
            status: createdUser.status
          }
        }
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Update user details and profile
   */
  async updateUser(req, res, next) {
    const { id } = req.params;
    const {
      fullName,
      email,
      phone,
      specialization,
      experienceYears,
      bio,
      address,
      notes
    } = req.body;

    try {
      const user = await userRepository.findById(id);
      if (!user) {
        return next(new AppError('User not found.', 404));
      }

      // Check if updating email and it's already in use
      if (email && email !== user.email) {
        const existingEmail = await userRepository.findByEmail(email);
        if (existingEmail) {
          return next(new AppError('Email is already registered.', 400));
        }
      }

      const userUpdates = {};
      if (fullName) userUpdates.full_name = fullName;
      if (email) userUpdates.email = email;
      if (phone !== undefined) userUpdates.phone = phone;

      let profileUpdates = null;
      if (user.role === 'CUSTOMER') {
        profileUpdates = {};
        if (address !== undefined) profileUpdates.address = address;
        if (notes !== undefined) profileUpdates.notes = notes;
      } else if (user.role === 'STAFF') {
        profileUpdates = {};
        if (specialization !== undefined) profileUpdates.specialization = specialization;
        if (experienceYears !== undefined) profileUpdates.experience_years = experienceYears;
        if (bio !== undefined) profileUpdates.bio = bio;
      }

      const oldValues = {
        fullName: user.full_name,
        email: user.email,
        phone: user.phone
      };

      await userRepository.update(id, userUpdates, profileUpdates);

      await logAudit({
        userId: req.user.id,
        action: 'ADMIN_UPDATED_USER',
        entityType: 'users',
        entityId: Number(id),
        oldValuesJson: oldValues,
        newValuesJson: userUpdates,
        ipAddress: req.ip
      });

      return sendSuccess(res, { message: 'User updated successfully.' });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Change user status (ACTIVE, INACTIVE, SUSPENDED)
   */
  async updateStatus(req, res, next) {
    const { id } = req.params;
    const { status } = req.body;

    if (Number(id) === req.user.id) {
      return next(new AppError('You cannot update your own account status.', 400));
    }

    try {
      const user = await userRepository.findById(id);
      if (!user) {
        return next(new AppError('User not found.', 404));
      }

      await userRepository.updateStatus(id, status);

      // Invalidate active sessions if status is changed to inactive/suspended
      if (status !== 'ACTIVE') {
        await tokenRepository.invalidateUserTokens(id, 'REFRESH_TOKEN');
      }

      await logAudit({
        userId: req.user.id,
        action: 'ADMIN_CHANGED_USER_STATUS',
        entityType: 'users',
        entityId: Number(id),
        oldValuesJson: { status: user.status },
        newValuesJson: { status },
        ipAddress: req.ip
      });

      return sendSuccess(res, { message: `User status changed to ${status.toLowerCase()} successfully.` });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Admin forces password reset by generating a new temporary password
   */
  async resetUserPassword(req, res, next) {
    const { id } = req.params;

    try {
      const user = await userRepository.findById(id);
      if (!user) {
        return next(new AppError('User not found.', 404));
      }

      // Generate a new temporary password
      const tempPassword = 'Reset_' + crypto.randomBytes(4).toString('hex');
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      // Update password and force change
      await userRepository.updatePassword(id, passwordHash, true);

      // Revoke sessions
      await tokenRepository.invalidateUserTokens(id, 'REFRESH_TOKEN');

      // Dispatch welcome/reset email
      await emailService.sendWelcomeEmail(user, tempPassword);

      await logAudit({
        userId: req.user.id,
        action: 'ADMIN_RESET_USER_PASSWORD',
        entityType: 'users',
        entityId: Number(id),
        ipAddress: req.ip
      });

      return sendSuccess(res, {
        message: 'User password reset successful. The welcome/reset email with temporary credentials has been dispatched.'
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Soft delete user
   */
  async deleteUser(req, res, next) {
    const { id } = req.params;

    if (Number(id) === req.user.id) {
      return next(new AppError('You cannot delete your own account.', 400));
    }

    try {
      const user = await userRepository.findById(id);
      if (!user) {
        return next(new AppError('User not found.', 404));
      }

      await userRepository.delete(id);

      // Invalidate active sessions
      await tokenRepository.invalidateUserTokens(id, 'REFRESH_TOKEN');

      await logAudit({
        userId: req.user.id,
        action: 'ADMIN_DELETED_USER',
        entityType: 'users',
        entityId: Number(id),
        ipAddress: req.ip
      });

      return sendSuccess(res, { message: 'User deleted successfully.' });
    } catch (error) {
      return next(error);
    }
  }
};

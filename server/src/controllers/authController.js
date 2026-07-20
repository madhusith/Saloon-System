import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { userRepository } from '../repositories/userRepository.js';
import { tokenRepository } from '../repositories/tokenRepository.js';
import { emailService } from '../services/emailService.js';
import { logAudit } from '../services/auditService.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';

// Hash helper for tokens stored in db
const hashTokenString = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const authController = {
  /**
   * Register a new customer
   */
  async register(req, res, next) {
    const { fullName, email, phone, password } = req.body;

    try {
      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) {
        return next(new AppError('Email is already registered.', 400));
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await userRepository.createCustomer({
        fullName,
        email,
        phone,
        passwordHash,
        emailVerifiedAt: null,
        status: 'ACTIVE'
      });

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashTokenString(verificationToken);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await tokenRepository.saveToken({
        userId: user.id,
        tokenType: 'EMAIL_VERIFICATION',
        tokenHash,
        expiresAt
      });

      // Send email
      await emailService.sendVerificationEmail(user, verificationToken);

      await logAudit({
        userId: user.id,
        action: 'USER_REGISTERED',
        entityType: 'users',
        entityId: user.id,
        ipAddress: req.ip
      });

      return sendSuccess(res, {
        statusCode: 201,
        message: 'Registration successful. Please check your email to verify your account.'
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * User login
   */
  async login(req, res, next) {
    const { email, password } = req.body;

    try {
      const user = await userRepository.findByEmail(email);
      if (!user) {
        return next(new AppError('Invalid email or password.', 401));
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return next(new AppError('Invalid email or password.', 401));
      }

      if (user.status !== 'ACTIVE') {
        return next(new AppError(`Your account is ${user.status.toLowerCase()}. Please contact administration.`, 403));
      }

      if (!user.email_verified_at) {
        return next(new AppError('Please verify your email address before logging in.', 403));
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      const tokenHash = hashTokenString(refreshToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await tokenRepository.saveToken({
        userId: user.id,
        tokenType: 'REFRESH_TOKEN',
        tokenHash,
        expiresAt
      });

      await logAudit({
        userId: user.id,
        action: 'USER_LOGGED_IN',
        ipAddress: req.ip
      });

      return sendSuccess(res, {
        message: 'Login successful.',
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            fullName: user.full_name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            mustChangePassword: !!user.must_change_password
          }
        }
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Verify email address
   */
  async verifyEmail(req, res, next) {
    const { token } = req.query;

    if (!token) {
      return next(new AppError('Verification token is missing.', 400));
    }

    try {
      const tokenHash = hashTokenString(token);
      const activeToken = await tokenRepository.findActiveByHash(tokenHash, 'EMAIL_VERIFICATION');

      if (!activeToken) {
        return next(new AppError('Verification link is invalid or has expired.', 400));
      }

      const user = await userRepository.findById(activeToken.user_id);
      if (!user) {
        return next(new AppError('User not found.', 404));
      }

      await tokenRepository.useToken(activeToken.id);
      await userRepository.update(user.id, { email_verified_at: new Date() });

      await logAudit({
        userId: user.id,
        action: 'EMAIL_VERIFIED',
        entityType: 'users',
        entityId: user.id,
        ipAddress: req.ip
      });

      return sendSuccess(res, { message: 'Email address verified successfully.' });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Resend email verification link
   */
  async resendVerification(req, res, next) {
    const { email } = req.body;

    try {
      const user = await userRepository.findByEmail(email);
      if (!user) {
        // Return generic success to avoid email enum
        return sendSuccess(res, { message: 'If the email exists, a verification link has been sent.' });
      }

      if (user.email_verified_at) {
        return next(new AppError('Email address is already verified.', 400));
      }

      // Invalidate old tokens
      await tokenRepository.invalidateUserTokens(user.id, 'EMAIL_VERIFICATION');

      // Generate new verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashTokenString(verificationToken);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await tokenRepository.saveToken({
        userId: user.id,
        tokenType: 'EMAIL_VERIFICATION',
        tokenHash,
        expiresAt
      });

      await emailService.sendVerificationEmail(user, verificationToken);

      return sendSuccess(res, { message: 'Verification link has been sent.' });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Request password reset
   */
  async forgotPassword(req, res, next) {
    const { email } = req.body;

    try {
      const user = await userRepository.findByEmail(email);
      const successMessage = 'If the email exists, a password reset link has been sent.';

      if (!user) {
        return sendSuccess(res, { message: successMessage });
      }

      // Invalidate existing reset tokens
      await tokenRepository.invalidateUserTokens(user.id, 'PASSWORD_RESET');

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashTokenString(resetToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await tokenRepository.saveToken({
        userId: user.id,
        tokenType: 'PASSWORD_RESET',
        tokenHash,
        expiresAt
      });

      await emailService.sendPasswordResetEmail(user, resetToken);

      await logAudit({
        userId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        ipAddress: req.ip
      });

      return sendSuccess(res, { message: successMessage });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Reset password with token
   */
  async resetPassword(req, res, next) {
    const { token, email, password } = req.body;

    try {
      const user = await userRepository.findByEmail(email);
      if (!user) {
        return next(new AppError('Password reset link is invalid or email does not match.', 400));
      }

      const tokenHash = hashTokenString(token);
      const activeToken = await tokenRepository.findActiveByHash(tokenHash, 'PASSWORD_RESET');

      if (!activeToken || activeToken.user_id !== user.id) {
        return next(new AppError('Password reset link is invalid or has expired.', 400));
      }

      // Hash password and save
      const passwordHash = await bcrypt.hash(password, 10);
      await userRepository.updatePassword(user.id, passwordHash, false);

      // Invalidate token
      await tokenRepository.useToken(activeToken.id);

      // Revoke refresh tokens
      await tokenRepository.invalidateUserTokens(user.id, 'REFRESH_TOKEN');

      await emailService.sendPasswordChangedEmail(user);

      await logAudit({
        userId: user.id,
        action: 'PASSWORD_RESET_COMPLETED',
        entityType: 'users',
        entityId: user.id,
        ipAddress: req.ip
      });

      return sendSuccess(res, { message: 'Your password has been reset successfully.' });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Refresh JWT access token
   */
  async refreshToken(req, res, next) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppError('Refresh token is required.', 400));
    }

    try {
      const tokenHash = hashTokenString(refreshToken);
      const activeToken = await tokenRepository.findActiveByHash(tokenHash, 'REFRESH_TOKEN');

      if (!activeToken) {
        return next(new AppError('Refresh token is invalid or has expired.', 401));
      }

      const user = await userRepository.findById(activeToken.user_id);
      if (!user || user.status !== 'ACTIVE') {
        return next(new AppError('User not found or account is not active.', 401));
      }

      const accessToken = generateAccessToken(user);

      return sendSuccess(res, {
        message: 'Token refreshed successfully.',
        data: { accessToken }
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * User logout
   */
  async logout(req, res, next) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppError('Refresh token is required.', 400));
    }

    try {
      const tokenHash = hashTokenString(refreshToken);
      const activeToken = await tokenRepository.findActiveByHash(tokenHash, 'REFRESH_TOKEN');

      if (activeToken) {
        await tokenRepository.invalidateUserTokens(activeToken.user_id, 'REFRESH_TOKEN');
        await logAudit({
          userId: activeToken.user_id,
          action: 'USER_LOGGED_OUT',
          ipAddress: req.ip
        });
      }

      return sendSuccess(res, { message: 'Logged out successfully.' });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Get current logged in user details
   */
  async getMe(req, res, next) {
    try {
      const user = await userRepository.findById(req.user.id);
      if (!user) {
        return next(new AppError('User not found.', 404));
      }

      const profile = await userRepository.findProfileByUserId(user.id, user.role);

      return sendSuccess(res, {
        message: 'Current profile retrieved.',
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
   * Change user password (authenticated)
   */
  async changePassword(req, res, next) {
    const { oldPassword, newPassword } = req.body;

    try {
      const user = await userRepository.findByEmail(req.user.email);
      if (!user) {
        return next(new AppError('User not found.', 404));
      }

      const isPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);
      if (!isPasswordValid) {
        return next(new AppError('Incorrect current password.', 400));
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await userRepository.updatePassword(user.id, passwordHash, false);

      // Invalidate all active sessions (force re-login)
      await tokenRepository.invalidateUserTokens(user.id, 'REFRESH_TOKEN');

      await emailService.sendPasswordChangedEmail(user);

      await logAudit({
        userId: user.id,
        action: 'PASSWORD_CHANGED',
        entityType: 'users',
        entityId: user.id,
        ipAddress: req.ip
      });

      return sendSuccess(res, { message: 'Your password has been changed successfully.' });
    } catch (error) {
      return next(error);
    }
  }
};

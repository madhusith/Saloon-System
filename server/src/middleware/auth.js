import { verifyAccessToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';
import { userRepository } from '../repositories/userRepository.js';

/**
 * Authentication middleware that verifies JWT access tokens.
 */
export const authenticate = async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Access token is missing or invalid.', 401));
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return next(new AppError('Access token has expired or is invalid.', 401));
  }

  try {
    // Optional check to ensure user still exists and is ACTIVE
    const user = await userRepository.findById(decoded.id);

    if (!user) {
      return next(new AppError('User belonging to this token no longer exists.', 401));
    }

    if (user.status !== 'ACTIVE') {
      return next(new AppError(`User account is ${user.status.toLowerCase()}.`, 403));
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Authorization middleware that checks user roles.
 * @param {...String} roles Allowed roles (e.g. 'ADMIN', 'STAFF')
 */
export const authorize = (...roles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('User is not authenticated.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }

    return next();
  };
};

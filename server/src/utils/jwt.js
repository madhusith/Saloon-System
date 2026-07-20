import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Generate a short-lived access token
 * @param {Object} user 
 * @returns {String}
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpiresIn }
  );
};

/**
 * Generate a long-lived refresh token
 * @param {Object} user 
 * @returns {String}
 */
export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiresIn }
  );
};

/**
 * Verify access token and return decoded payload
 * @param {String} token 
 * @returns {Object}
 */
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, env.jwt.accessSecret);
  } catch (error) {
    return null;
  }
};

/**
 * Verify refresh token and return decoded payload
 * @param {String} token 
 * @returns {Object}
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, env.jwt.refreshSecret);
  } catch (error) {
    return null;
  }
};

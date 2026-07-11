import { env } from '../config/env.js';
import { sendError } from '../utils/apiResponse.js';

export const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error.';
  const errors = err.errors || [];

  if (env.nodeEnv !== 'production') {
    console.error(err);
  }

  return sendError(res, {
    statusCode,
    message,
    errors: env.nodeEnv === 'production' && statusCode === 500 ? [] : errors
  });
};


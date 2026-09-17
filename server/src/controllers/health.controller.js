import { testDatabaseConnection } from '../config/database.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getHealth = async (_req, res) => {
  let database = 'unavailable';

  let dbError = null;
  try {
    await testDatabaseConnection();
    database = 'available';
  } catch (error) {
    database = 'unavailable';
    dbError = error.message;
    console.error('Database connection error in health check:', error);
  }

  return sendSuccess(res, {
    message: 'Server health check completed.',
    data: {
      status: 'ok',
      database,
      dbError,
      dbHost: process.env.MYSQLHOST || process.env.DB_HOST || 'default',
      timestamp: new Date().toISOString()
    }
  });
};


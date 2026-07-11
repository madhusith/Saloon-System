import { testDatabaseConnection } from '../config/database.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getHealth = async (_req, res) => {
  let database = 'unavailable';

  try {
    await testDatabaseConnection();
    database = 'available';
  } catch (_error) {
    database = 'unavailable';
  }

  return sendSuccess(res, {
    message: 'Server health check completed.',
    data: {
      status: 'ok',
      database,
      timestamp: new Date().toISOString()
    }
  });
};


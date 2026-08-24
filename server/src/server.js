import http from 'http';
import app from './app.js';
import { env, validateEnv } from './config/env.js';
import { initSocket } from './sockets/socket.js';

import { pool } from './config/database.js';

// Initialize and validate configurations
validateEnv();

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server, env.clientUrl);

const ensureDatabaseColumns = async () => {
  try {
    await pool.execute('ALTER TABLE appointments ADD COLUMN cancellation_reason VARCHAR(500) NULL');
    console.log('Database check: Added cancellation_reason to appointments');
  } catch (err) {
    if (err.code !== 'ER_DUP_FIELDNAME') {
      console.error('Error adding cancellation_reason column:', err);
    }
  }
  try {
    await pool.execute('ALTER TABLE payments ADD COLUMN cashier_name VARCHAR(255) NULL');
    console.log('Database check: Added cashier_name to payments');
  } catch (err) {
    if (err.code !== 'ER_DUP_FIELDNAME') {
      console.error('Error adding cashier_name column:', err);
    }
  }
};

ensureDatabaseColumns().then(() => {
  server.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
});

const shutdown = (signal) => {
  console.log(`${signal} received. Closing server.`);
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));


import http from 'http';
import app from './app.js';
import { env, validateEnv } from './config/env.js';
import { initSocket } from './sockets/socket.js';

import { pool } from './config/database.js';

// Initialize and validate configurations (including SMTP email service)
validateEnv();

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server, env.clientUrl);

import fs from 'fs';

const initDatabaseSchema = async () => {
  try {
    const [tables] = await pool.query("SHOW TABLES LIKE 'users'");
    if (Array.isArray(tables) && tables.length === 0) {
      console.log('Database is empty. Initializing production schema and seed data...');
      const sqlUrl = new URL('./database/production_setup.sql', import.meta.url);
      if (fs.existsSync(sqlUrl)) {
        const sqlContent = fs.readFileSync(sqlUrl, 'utf8');
        const statements = sqlContent
          .replace(/--.*$/gm, '')
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0);

        for (const statement of statements) {
          try {
            await pool.query(statement);
          } catch (stmtErr) {
            console.warn('SQL statement execution notice:', stmtErr.message);
          }
        }
        console.log(`Executed ${statements.length} SQL statements. Production database ready!`);
      }
    }
  } catch (err) {
    console.error('Database auto-initialization note:', err.message);
  }
};

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
  try {
    await pool.execute('ALTER TABLE payments ADD COLUMN order_id INT NULL');
    console.log('Database check: Added order_id to payments');
  } catch (err) {
    if (err.code !== 'ER_DUP_FIELDNAME') {
      // Ignore if column already exists or table does not exist
    }
  }
  try {
    await pool.execute('ALTER TABLE services MODIFY COLUMN price DECIMAL(10,2) NULL');
    await pool.execute('ALTER TABLE services MODIFY COLUMN duration_minutes INT NULL');
  } catch (err) {
    // Ignore if table does not exist yet or already nullable
  }
};

initDatabaseSchema().then(() => ensureDatabaseColumns()).then(() => {
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


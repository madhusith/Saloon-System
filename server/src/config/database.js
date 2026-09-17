import mysql from 'mysql2/promise';
import { env } from './env.js';

const connectionConfig = (process.env.MYSQL_URL || process.env.DATABASE_URL)
  ? {
      uri: process.env.MYSQL_URL || process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      decimalNumbers: true,
      multipleStatements: true
    }
  : {
      host: env.database.host,
      port: env.database.port,
      database: env.database.name,
      user: env.database.user,
      password: env.database.password,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      decimalNumbers: true,
      multipleStatements: true
    };

export const pool = mysql.createPool(connectionConfig);

export const testDatabaseConnection = async () => {
  const connection = await pool.getConnection();

  try {
    await connection.ping();
    return true;
  } finally {
    connection.release();
  }
};


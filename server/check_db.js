import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  database: 'salon_management',
  user: 'root',
  password: ''
});

async function run() {
  try {
    const [rows] = await pool.execute('SELECT * FROM staff_schedules');
    console.log('Current staff schedules:');
    console.log(JSON.stringify(rows, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

run();

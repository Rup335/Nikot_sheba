// MySQL connection pool (shared by all routes)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'local_service_directory',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true, // return DATE/TIME as plain text (no timezone problems)
  // Cloud MySQL services usually need SSL. Set DB_SSL=true in .env when deploying.
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined
});

module.exports = pool;

// ServiceHub - Local Service Provider Directory
// Start with:  npm start   then open  http://localhost:3000
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const session = require('express-session');
const pool = require('./src/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Front-end files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api', require('./src/routes/public'));
app.use('/api/bookings', require('./src/routes/bookings'));
app.use('/api/reviews', require('./src/routes/reviews'));
app.use('/api/provider', require('./src/routes/provider'));
app.use('/api/admin', require('./src/routes/admin'));

// Unknown API URL
app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found.' }));

// Any server error ends up here
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error. Check the terminal for details.' });
});

app.listen(PORT, async () => {
  console.log(`Server running:  http://localhost:${PORT}`);
  try {
    await pool.query('SELECT 1');
    console.log('MySQL connected.');
  } catch (err) {
    console.error('MySQL connection FAILED: ' + err.message);
    console.error('Check your .env file and make sure MySQL is running and database.sql is imported.');
  }
});

// Register, login, logout, current user, profile update
const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { wrap, fail } = require('../utils');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

// ---------- Register ----------
router.post('/register', wrap(async (req, res) => {
  const b = req.body;
  const name = (b.name || '').trim();
  const email = (b.email || '').trim().toLowerCase();
  const phone = (b.phone || '').trim();
  const password = b.password || '';
  const role = b.role;

  const errors = [];
  if (name.length < 2) errors.push('Name must be at least 2 characters.');
  if (!/^\S+@\S+\.\S+$/.test(email)) errors.push('Enter a valid email address.');
  if (!/^[0-9+\-\s]{7,20}$/.test(phone)) errors.push('Enter a valid phone number.');
  if (password.length < 6) errors.push('Password must be at least 6 characters.');
  if (role !== 'customer' && role !== 'provider') errors.push('Choose a valid account type.');

  let categoryId = 0, area = '', price = 0, experience = 0, bio = '';
  if (role === 'provider') {
    categoryId = parseInt(b.category_id) || 0;
    area = (b.area || '').trim();
    price = Number(b.price_per_hour);
    experience = parseInt(b.experience_years);
    bio = (b.bio || '').trim();
    if (!categoryId) errors.push('Choose your service category.');
    if (!area) errors.push('Service area is required.');
    if (!(price > 0)) errors.push('Enter a valid price per hour.');
    if (isNaN(experience) || experience < 0) errors.push('Enter your years of experience.');
  }
  if (errors.length) return fail(res, errors.join(' '));

  const [exists] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (exists.length) return fail(res, 'This email is already registered.');

  if (role === 'provider') {
    const [cat] = await pool.query('SELECT id FROM categories WHERE id = ?', [categoryId]);
    if (!cat.length) return fail(res, 'Selected category does not exist.');
  }

  const hash = await bcrypt.hash(password, 10);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query(
      'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, hash, phone, role]
    );
    if (role === 'provider') {
      await conn.query(
        `INSERT INTO provider_profiles (user_id, category_id, area, price_per_hour, experience_years, bio, approved)
         VALUES (?, ?, ?, ?, ?, ?, 0)`,
        [r.insertId, categoryId, area, price, experience, bio]
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') return fail(res, 'This email is already registered.');
    throw err;
  } finally {
    conn.release();
  }

  const msg = role === 'provider'
    ? 'Registration successful! Your profile will appear after the admin approves it. You can login now.'
    : 'Registration successful! You can login now.';
  res.json({ message: msg });
}));

// ---------- Login ----------
router.post('/login', wrap(async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';
  if (!email || !password) return fail(res, 'Enter email and password.');

  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return fail(res, 'Invalid email or password.', 401);
  }
  if (user.status === 'blocked') return fail(res, 'Your account is blocked. Contact the admin.', 403);

  req.session.regenerate((err) => {
    if (err) return fail(res, 'Could not start session.', 500);
    req.session.user = { id: user.id, name: user.name, role: user.role };
    res.json({ user: req.session.user });
  });
}));

// ---------- Logout ----------
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out.' });
  });
});

// ---------- Who am I? (used by every page to build the menu) ----------
router.get('/me', wrap(async (req, res) => {
  if (!req.session.user) return res.json({ user: null });
  const [rows] = await pool.query(
    'SELECT id, name, email, phone, role, status FROM users WHERE id = ?', [req.session.user.id]
  );
  if (!rows.length || rows[0].status === 'blocked') {
    req.session.destroy(() => {});
    return res.json({ user: null });
  }
  res.json({ user: rows[0] });
}));

// ---------- Update name / phone ----------
router.put('/profile', requireLogin, wrap(async (req, res) => {
  const name = (req.body.name || '').trim();
  const phone = (req.body.phone || '').trim();
  if (name.length < 2) return fail(res, 'Name must be at least 2 characters.');
  if (!/^[0-9+\-\s]{7,20}$/.test(phone)) return fail(res, 'Enter a valid phone number.');
  await pool.query('UPDATE users SET name = ?, phone = ? WHERE id = ?', [name, phone, req.session.user.id]);
  req.session.user.name = name;
  res.json({ message: 'Profile updated.' });
}));

// ---------- Change password ----------
router.put('/password', requireLogin, wrap(async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!new_password || new_password.length < 6) return fail(res, 'New password must be at least 6 characters.');
  const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [req.session.user.id]);
  if (!rows.length || !(await bcrypt.compare(current_password || '', rows[0].password))) {
    return fail(res, 'Current password is wrong.');
  }
  const hash = await bcrypt.hash(new_password, 10);
  await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash, req.session.user.id]);
  res.json({ message: 'Password changed.' });
}));

module.exports = router;

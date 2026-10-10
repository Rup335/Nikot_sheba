// Admin panel API: stats, users, providers, categories, reviews
const express = require('express');
const pool = require('../db');
const { wrap, fail } = require('../utils');
const { requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireRole('admin'));

// ---------- Overview numbers ----------
router.get('/stats', wrap(async (req, res) => {
  const [[u]] = await pool.query(
    `SELECT COALESCE(SUM(role = 'customer'), 0) AS customers,
            COALESCE(SUM(role = 'provider'), 0) AS providers
     FROM users`
  );
  const [[pending]] = await pool.query('SELECT COUNT(*) AS total FROM provider_profiles WHERE approved = 0');
  const [[rev]] = await pool.query('SELECT COUNT(*) AS total FROM reviews');
  const [byStatus] = await pool.query('SELECT status, COUNT(*) AS total FROM bookings GROUP BY status');

  const [recent] = await pool.query(
    `SELECT b.id, b.booking_date, b.booking_time, b.status,
            cu.name AS customer_name, pu.name AS provider_name
     FROM bookings b
     JOIN users cu ON cu.id = b.customer_id
     JOIN users pu ON pu.id = b.provider_id
     ORDER BY b.created_at DESC, b.id DESC LIMIT 8`
  );
  const [top] = await pool.query(
    `SELECT u.id, u.name, c.name AS category,
            (SELECT AVG(r.rating) FROM reviews r WHERE r.provider_id = u.id) AS avg_rating,
            (SELECT COUNT(*) FROM reviews r WHERE r.provider_id = u.id) AS review_count
     FROM provider_profiles p
     JOIN users u ON u.id = p.user_id
     JOIN categories c ON c.id = p.category_id
     WHERE p.approved = 1
     ORDER BY avg_rating DESC, review_count DESC LIMIT 5`
  );

  const bookingTotal = byStatus.reduce((sum, s) => sum + Number(s.total), 0);
  res.json({
    customers: Number(u.customers),
    providers: Number(u.providers),
    pending_approvals: Number(pending.total),
    reviews: Number(rev.total),
    bookings_total: bookingTotal,
    bookings_by_status: byStatus.map((s) => ({ status: s.status, total: Number(s.total) })),
    recent_bookings: recent,
    top_providers: top.map((t) => ({
      ...t,
      avg_rating: t.avg_rating === null ? null : Number(t.avg_rating),
      review_count: Number(t.review_count)
    }))
  });
}));

// ---------- Users ----------
router.get('/users', wrap(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, name, email, phone, role, status, created_at FROM users ORDER BY id'
  );
  res.json({ users: rows });
}));

router.patch('/users/:id/status', wrap(async (req, res) => {
  const id = parseInt(req.params.id);
  const status = req.body.status;
  if (!['active', 'blocked'].includes(status)) return fail(res, 'Invalid status.');
  if (id === req.session.user.id) return fail(res, 'You cannot block your own account.');
  const [r] = await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
  if (!r.affectedRows) return fail(res, 'User not found.', 404);
  res.json({ message: 'User is now ' + status + '.' });
}));

router.delete('/users/:id', wrap(async (req, res) => {
  const id = parseInt(req.params.id);
  if (id === req.session.user.id) return fail(res, 'You cannot delete your own account.');
  const [r] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
  if (!r.affectedRows) return fail(res, 'User not found.', 404);
  res.json({ message: 'User deleted.' });
}));

// ---------- Providers (approval) ----------
router.get('/providers', wrap(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.phone, u.status, c.name AS category,
            p.area, p.price_per_hour, p.experience_years, p.approved,
            (SELECT AVG(r.rating) FROM reviews r WHERE r.provider_id = u.id) AS avg_rating,
            (SELECT COUNT(*) FROM reviews r WHERE r.provider_id = u.id) AS review_count
     FROM provider_profiles p
     JOIN users u ON u.id = p.user_id
     JOIN categories c ON c.id = p.category_id
     ORDER BY p.approved ASC, u.id`
  );
  res.json({
    providers: rows.map((r) => ({
      ...r,
      price_per_hour: Number(r.price_per_hour),
      approved: r.approved == 1,
      avg_rating: r.avg_rating === null ? null : Number(r.avg_rating),
      review_count: Number(r.review_count)
    }))
  });
}));

router.patch('/providers/:id/approval', wrap(async (req, res) => {
  const id = parseInt(req.params.id);
  const approved = req.body.approved ? 1 : 0;
  const [r] = await pool.query('UPDATE provider_profiles SET approved = ? WHERE user_id = ?', [approved, id]);
  if (!r.affectedRows) return fail(res, 'Provider not found.', 404);
  res.json({ message: approved ? 'Provider approved.' : 'Provider set to pending.' });
}));

// ---------- Categories (CRUD) ----------
router.post('/categories', wrap(async (req, res) => {
  const name = (req.body.name || '').trim();
  const description = (req.body.description || '').trim();
  if (name.length < 2) return fail(res, 'Category name must be at least 2 characters.');
  try {
    await pool.query('INSERT INTO categories (name, description) VALUES (?, ?)', [name, description]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return fail(res, 'This category already exists.');
    throw err;
  }
  res.json({ message: 'Category added.' });
}));

router.put('/categories/:id', wrap(async (req, res) => {
  const id = parseInt(req.params.id);
  const name = (req.body.name || '').trim();
  const description = (req.body.description || '').trim();
  if (name.length < 2) return fail(res, 'Category name must be at least 2 characters.');
  try {
    const [r] = await pool.query('UPDATE categories SET name = ?, description = ? WHERE id = ?', [name, description, id]);
    if (!r.affectedRows) return fail(res, 'Category not found.', 404);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return fail(res, 'Another category already uses this name.');
    throw err;
  }
  res.json({ message: 'Category updated.' });
}));

router.delete('/categories/:id', wrap(async (req, res) => {
  const id = parseInt(req.params.id);
  const [[used]] = await pool.query('SELECT COUNT(*) AS total FROM provider_profiles WHERE category_id = ?', [id]);
  if (Number(used.total) > 0) return fail(res, 'This category is used by providers, so it cannot be deleted.');
  const [r] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
  if (!r.affectedRows) return fail(res, 'Category not found.', 404);
  res.json({ message: 'Category deleted.' });
}));

// ---------- Reviews (moderation) ----------
router.get('/reviews', wrap(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT r.id, r.rating, r.comment, r.created_at,
            cu.name AS customer_name, pu.name AS provider_name
     FROM reviews r
     JOIN users cu ON cu.id = r.customer_id
     JOIN users pu ON pu.id = r.provider_id
     ORDER BY r.created_at DESC, r.id DESC`
  );
  res.json({ reviews: rows });
}));

router.delete('/reviews/:id', wrap(async (req, res) => {
  const [r] = await pool.query('DELETE FROM reviews WHERE id = ?', [parseInt(req.params.id)]);
  if (!r.affectedRows) return fail(res, 'Review not found.', 404);
  res.json({ message: 'Review deleted.' });
}));

module.exports = router;

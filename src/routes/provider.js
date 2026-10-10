// Provider's own service profile + dashboard summary
const express = require('express');
const pool = require('../db');
const { wrap, fail } = require('../utils');
const { requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireRole('provider'));

// ---------- Get my service profile ----------
router.get('/profile', wrap(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT category_id, area, price_per_hour, experience_years, bio, approved
     FROM provider_profiles WHERE user_id = ?`,
    [req.session.user.id]
  );
  const p = rows[0] || null;
  if (p) {
    p.price_per_hour = Number(p.price_per_hour);
    p.approved = p.approved == 1;
  }
  res.json({ profile: p });
}));

// ---------- Create / update my service profile ----------
router.put('/profile', wrap(async (req, res) => {
  const categoryId = parseInt(req.body.category_id) || 0;
  const area = (req.body.area || '').trim();
  const price = Number(req.body.price_per_hour);
  const experience = parseInt(req.body.experience_years);
  const bio = (req.body.bio || '').trim();

  if (!categoryId) return fail(res, 'Choose your service category.');
  if (!area) return fail(res, 'Service area is required.');
  if (!(price > 0)) return fail(res, 'Enter a valid price per hour.');
  if (isNaN(experience) || experience < 0) return fail(res, 'Enter your years of experience.');

  const [cat] = await pool.query('SELECT id FROM categories WHERE id = ?', [categoryId]);
  if (!cat.length) return fail(res, 'Selected category does not exist.');

  const uid = req.session.user.id;
  const [exists] = await pool.query('SELECT id FROM provider_profiles WHERE user_id = ?', [uid]);
  if (exists.length) {
    await pool.query(
      `UPDATE provider_profiles
       SET category_id = ?, area = ?, price_per_hour = ?, experience_years = ?, bio = ?
       WHERE user_id = ?`,
      [categoryId, area, price, experience, bio, uid]
    );
  } else {
    await pool.query(
      `INSERT INTO provider_profiles (user_id, category_id, area, price_per_hour, experience_years, bio, approved)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [uid, categoryId, area, price, experience, bio]
    );
  }
  res.json({ message: 'Service profile saved.' });
}));

// ---------- Dashboard numbers + latest reviews ----------
router.get('/summary', wrap(async (req, res) => {
  const uid = req.session.user.id;

  const [[counts]] = await pool.query(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(status = 'pending'), 0)   AS pending,
            COALESCE(SUM(status = 'accepted'), 0)  AS accepted,
            COALESCE(SUM(status = 'completed'), 0) AS completed
     FROM bookings WHERE provider_id = ?`,
    [uid]
  );
  const [[rating]] = await pool.query(
    'SELECT AVG(rating) AS avg_rating, COUNT(*) AS review_count FROM reviews WHERE provider_id = ?',
    [uid]
  );
  const [[profile]] = await pool.query(
    'SELECT approved FROM provider_profiles WHERE user_id = ?', [uid]
  );
  const [reviews] = await pool.query(
    `SELECT r.rating, r.comment, r.created_at, u.name AS customer
     FROM reviews r JOIN users u ON u.id = r.customer_id
     WHERE r.provider_id = ? ORDER BY r.created_at DESC LIMIT 5`,
    [uid]
  );

  res.json({
    has_profile: !!profile,
    approved: profile ? profile.approved == 1 : false,
    total: Number(counts.total),
    pending: Number(counts.pending),
    accepted: Number(counts.accepted),
    completed: Number(counts.completed),
    avg_rating: rating.avg_rating === null ? null : Number(rating.avg_rating),
    review_count: Number(rating.review_count),
    reviews
  });
}));

module.exports = router;

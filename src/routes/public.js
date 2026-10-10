// Public pages data: categories, provider search, provider details
const express = require('express');
const pool = require('../db');
const { wrap, fail, shapeProvider } = require('../utils');

const router = express.Router();

// Columns shared by the provider list and provider detail queries
const PROVIDER_FIELDS = `
  u.id, u.name, c.id AS category_id, c.name AS category,
  p.area, p.price_per_hour, p.experience_years,
  (SELECT AVG(r.rating) FROM reviews r WHERE r.provider_id = u.id) AS avg_rating,
  (SELECT COUNT(*)      FROM reviews r WHERE r.provider_id = u.id) AS review_count`;

const PROVIDER_FROM = `
  FROM provider_profiles p
  JOIN users u      ON u.id = p.user_id
  JOIN categories c ON c.id = p.category_id`;

// ---------- Categories (with number of approved providers) ----------
router.get('/categories', wrap(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT c.id, c.name, c.description,
       (SELECT COUNT(*) FROM provider_profiles p JOIN users u ON u.id = p.user_id
         WHERE p.category_id = c.id AND p.approved = 1 AND u.status = 'active') AS provider_count
     FROM categories c ORDER BY c.name`
  );
  res.json({ categories: rows });
}));

// ---------- Search providers ----------
router.get('/providers', wrap(async (req, res) => {
  const q = (req.query.q || '').trim();
  const category = parseInt(req.query.category) || 0;
  const area = (req.query.area || '').trim();
  const sort = req.query.sort || 'rating';
  const limit = parseInt(req.query.limit) || 0;

  const where = ['p.approved = 1', "u.status = 'active'"];
  const params = [];
  if (q) { where.push('u.name LIKE ?'); params.push('%' + q + '%'); }
  if (category) { where.push('p.category_id = ?'); params.push(category); }
  if (area) { where.push('p.area LIKE ?'); params.push('%' + area + '%'); }

  // Only these ORDER BY values are allowed (never place user text in SQL)
  const orders = {
    rating: 'avg_rating DESC, review_count DESC',
    price_low: 'p.price_per_hour ASC',
    price_high: 'p.price_per_hour DESC',
    exp: 'p.experience_years DESC'
  };
  const orderBy = orders[sort] || orders.rating;

  let sql = `SELECT ${PROVIDER_FIELDS} ${PROVIDER_FROM} WHERE ${where.join(' AND ')} ORDER BY ${orderBy}`;
  if (limit > 0 && limit <= 50) sql += ` LIMIT ${limit}`;

  const [rows] = await pool.query(sql, params);
  res.json({ providers: rows.map(shapeProvider) });
}));

// ---------- One provider + reviews ----------
router.get('/providers/:id', wrap(async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) return fail(res, 'Provider not found.', 404);

  const [rows] = await pool.query(
    `SELECT ${PROVIDER_FIELDS}, p.bio, p.approved, u.phone
     ${PROVIDER_FROM}
     WHERE u.id = ? AND u.status = 'active'`,
    [id]
  );
  const me = req.session.user;
  const row = rows[0];
  const allowed = row && (row.approved == 1 || (me && (me.role === 'admin' || me.id === id)));
  if (!allowed) return fail(res, 'Provider not found.', 404);

  const [reviews] = await pool.query(
    `SELECT r.rating, r.comment, r.created_at, u.name AS customer
     FROM reviews r JOIN users u ON u.id = r.customer_id
     WHERE r.provider_id = ? ORDER BY r.created_at DESC`,
    [id]
  );

  const provider = shapeProvider(row);
  provider.approved = row.approved == 1;
  provider.phone = me ? row.phone : null; // phone number only for logged-in users
  res.json({ provider, reviews });
}));

module.exports = router;

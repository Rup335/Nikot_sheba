// Bookings: create (customer), list (all roles), change status
const express = require('express');
const pool = require('../db');
const { wrap, fail, todayStr, isValidDate, isValidTime } = require('../utils');
const { requireLogin, requireRole } = require('../middleware/auth');

const router = express.Router();

// ---------- List my bookings (what you see depends on your role) ----------
router.get('/', requireLogin, wrap(async (req, res) => {
  const me = req.session.user;
  let where = '';
  let params = [];
  if (me.role === 'customer') { where = 'WHERE b.customer_id = ?'; params = [me.id]; }
  if (me.role === 'provider') { where = 'WHERE b.provider_id = ?'; params = [me.id]; }

  const [rows] = await pool.query(
    `SELECT b.id, b.booking_date, b.booking_time, b.address, b.note, b.status, b.created_at,
            b.provider_id, b.customer_id,
            pu.name AS provider_name, pu.phone AS provider_phone, c.name AS category,
            cu.name AS customer_name, cu.phone AS customer_phone,
            r.rating, r.comment AS review_comment
     FROM bookings b
     JOIN users pu ON pu.id = b.provider_id
     JOIN users cu ON cu.id = b.customer_id
     LEFT JOIN provider_profiles p ON p.user_id = b.provider_id
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN reviews r ON r.booking_id = b.id
     ${where}
     ORDER BY b.booking_date DESC, b.booking_time DESC`,
    params
  );
  res.json({ bookings: rows });
}));

// ---------- Create a booking (customer only) ----------
router.post('/', requireRole('customer'), wrap(async (req, res) => {
  const providerId = parseInt(req.body.provider_id);
  const date = req.body.booking_date;
  const time = req.body.booking_time;
  const address = (req.body.address || '').trim();
  const note = (req.body.note || '').trim();

  if (!providerId) return fail(res, 'Choose a provider.');
  if (!isValidDate(date)) return fail(res, 'Choose a valid date.');
  if (date < todayStr()) return fail(res, 'Booking date cannot be in the past.');
  if (!isValidTime(time)) return fail(res, 'Choose a valid time.');
  if (!address) return fail(res, 'Please enter the service address.');

  const [prov] = await pool.query(
    `SELECT u.id FROM users u JOIN provider_profiles p ON p.user_id = u.id
     WHERE u.id = ? AND u.status = 'active' AND p.approved = 1`,
    [providerId]
  );
  if (!prov.length) return fail(res, 'This provider is not available.', 404);

  // Same provider cannot be booked twice at the same time
  const [clash] = await pool.query(
    `SELECT id FROM bookings
     WHERE provider_id = ? AND booking_date = ? AND booking_time = ?
       AND status IN ('pending', 'accepted')`,
    [providerId, date, time]
  );
  if (clash.length) return fail(res, 'The provider is already booked at that time. Please choose another time.');

  await pool.query(
    `INSERT INTO bookings (customer_id, provider_id, booking_date, booking_time, address, note)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [req.session.user.id, providerId, date, time, address, note]
  );
  res.json({ message: 'Booking request sent! The provider will respond soon.' });
}));

// ---------- Change booking status ----------
// customer: cancel      provider: accept / reject / complete
router.patch('/:id/status', requireRole('customer', 'provider'), wrap(async (req, res) => {
  const id = parseInt(req.params.id);
  const newStatus = req.body.status;
  const me = req.session.user;

  const [rows] = await pool.query('SELECT * FROM bookings WHERE id = ?', [id]);
  const booking = rows[0];
  if (!booking) return fail(res, 'Booking not found.', 404);

  let allowed = false;
  if (me.role === 'customer' && booking.customer_id === me.id) {
    allowed = newStatus === 'cancelled' && ['pending', 'accepted'].includes(booking.status);
  }
  if (me.role === 'provider' && booking.provider_id === me.id) {
    if ((newStatus === 'accepted' || newStatus === 'rejected') && booking.status === 'pending') allowed = true;
    if (newStatus === 'completed' && booking.status === 'accepted') allowed = true;
  }
  if (!allowed) return fail(res, 'This change is not allowed.', 403);

  await pool.query('UPDATE bookings SET status = ? WHERE id = ?', [newStatus, id]);
  res.json({ message: 'Booking ' + newStatus + '.' });
}));

module.exports = router;

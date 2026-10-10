// Customers review a provider after a completed booking
const express = require('express');
const pool = require('../db');
const { wrap, fail } = require('../utils');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireRole('customer'), wrap(async (req, res) => {
  const bookingId = parseInt(req.body.booking_id);
  const rating = parseInt(req.body.rating);
  const comment = (req.body.comment || '').trim();

  if (!bookingId) return fail(res, 'Booking not found.', 404);
  if (!(rating >= 1 && rating <= 5)) return fail(res, 'Rating must be between 1 and 5.');
  if (comment.length > 1000) return fail(res, 'Comment is too long (max 1000 characters).');

  const [rows] = await pool.query(
    'SELECT id, provider_id, status FROM bookings WHERE id = ? AND customer_id = ?',
    [bookingId, req.session.user.id]
  );
  const booking = rows[0];
  if (!booking) return fail(res, 'Booking not found.', 404);
  if (booking.status !== 'completed') return fail(res, 'You can review only completed bookings.');

  const [done] = await pool.query('SELECT id FROM reviews WHERE booking_id = ?', [bookingId]);
  if (done.length) return fail(res, 'You already reviewed this booking.');

  await pool.query(
    'INSERT INTO reviews (booking_id, customer_id, provider_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
    [bookingId, req.session.user.id, booking.provider_id, rating, comment]
  );
  res.json({ message: 'Thank you! Your review was saved.' });
}));

module.exports = router;

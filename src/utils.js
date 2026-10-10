// Small helper functions used by the routes

// Express 4 does not catch errors in async functions, so we wrap them.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Send an error response:  fail(res, 'Message', 400)
const fail = (res, message, code = 400) => res.status(code).json({ error: message });

// Today's date as YYYY-MM-DD (server local time)
function todayStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// True for real dates like 2026-10-25 (rejects 2026-13-45)
function isValidDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

// True for HH:MM (24 hour)
function isValidTime(s) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(s || '');
}

// MySQL returns DECIMAL/AVG as text - convert numbers for the frontend
function shapeProvider(row) {
  return {
    ...row,
    price_per_hour: Number(row.price_per_hour),
    experience_years: Number(row.experience_years),
    avg_rating: row.avg_rating === null || row.avg_rating === undefined ? null : Number(row.avg_rating),
    review_count: Number(row.review_count || 0)
  };
}

module.exports = { wrap, fail, todayStr, isValidDate, isValidTime, shapeProvider };

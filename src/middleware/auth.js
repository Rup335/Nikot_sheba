// Login / role checks. Used on routes that need a logged-in user.
const pool = require('../db');

async function loadUser(req, res) {
  const sessionUser = req.session.user;
  if (!sessionUser) {
    res.status(401).json({ error: 'Please login first.' });
    return null;
  }
  // Re-check the database so deleted/blocked users are logged out immediately
  const [rows] = await pool.query('SELECT id, status FROM users WHERE id = ?', [sessionUser.id]);
  if (rows.length === 0 || rows[0].status === 'blocked') {
    req.session.destroy(() => {});
    res.status(401).json({ error: 'Your account is not available. Please contact the admin.' });
    return null;
  }
  return sessionUser;
}

function requireLogin(req, res, next) {
  loadUser(req, res).then((u) => { if (u) next(); }).catch(next);
}

function requireRole(...roles) {
  return (req, res, next) => {
    loadUser(req, res)
      .then((u) => {
        if (!u) return;
        if (!roles.includes(u.role)) {
          return res.status(403).json({ error: 'You do not have permission to do this.' });
        }
        next();
      })
      .catch(next);
  };
}

module.exports = { requireLogin, requireRole };

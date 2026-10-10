/* ==========================================================
   Shared JavaScript - loaded on every page
   ========================================================== */

// ---------- Talk to the server ----------
async function api(url, options) {
  options = options || {};
  const settings = { method: options.method || 'GET', headers: {}, credentials: 'same-origin' };
  if (options.body) {
    settings.headers['Content-Type'] = 'application/json';
    settings.body = JSON.stringify(options.body);
  }
  const res = await fetch(url, settings);
  let data = {};
  try { data = await res.json(); } catch (e) { /* no JSON body */ }
  if (!res.ok) {
    const err = new Error(data.error || 'Something went wrong. Please try again.');
    err.status = res.status;
    throw err;
  }
  return data;
}

// ---------- Small helpers ----------
// Escape text before putting it into HTML (stops XSS)
function esc(text) {
  return String(text === null || text === undefined ? '' : text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function stars(rating) {
  const r = Math.round(rating || 0);
  return '★'.repeat(r) + '☆'.repeat(5 - r);
}

function fmtDate(d) {
  if (!d) return '';
  const parts = String(d).substring(0, 10).split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return parts[2] + ' ' + months[Number(parts[1]) - 1] + ' ' + parts[0];
}

function fmtTime(t) {
  if (!t) return '';
  let [h, m] = String(t).split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ' ' + ampm;
}

function todayISO() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function badge(status) {
  return '<span class="badge badge-' + esc(status) + '">' + esc(status.charAt(0).toUpperCase() + status.slice(1)) + '</span>';
}

// Show a message at the top of the page (type: success | error | info)
function showAlert(message, type) {
  const box = document.getElementById('alert-box');
  if (!box) return;
  box.innerHTML = '<div class="alert alert-' + (type || 'success') + '">' + esc(message) + '</div>';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Provider card HTML (used on home and search pages)
function providerCard(p) {
  const rating = p.review_count > 0
    ? '<span class="stars">' + stars(p.avg_rating) + '</span> <strong>' + p.avg_rating.toFixed(1) +
      '</strong> <span class="muted">(' + p.review_count + ' reviews)</span>'
    : '<span class="muted">No reviews yet</span>';
  return '<div class="card provider-card">' +
    '<div class="card-top"><h3>' + esc(p.name) + '</h3><span class="tag">' + esc(p.category) + '</span></div>' +
    '<p class="muted">📍 ' + esc(p.area) + ' &nbsp;|&nbsp; 💼 ' + p.experience_years + ' yrs experience</p>' +
    '<p class="rating">' + rating + '</p>' +
    '<div class="card-bottom"><span class="price">৳' + p.price_per_hour.toLocaleString() + ' <small>/ hour</small></span>' +
    '<a class="btn btn-small" href="provider.html?id=' + p.id + '">View &amp; Book</a></div></div>';
}

// ---------- Layout: menu + footer + login state ----------
async function initPage() {
  let user = null;
  try {
    const data = await api('/api/auth/me');
    user = data.user;
  } catch (e) { /* not logged in */ }

  const dashboards = { customer: 'customer.html', provider: 'provider-dashboard.html', admin: 'admin.html' };
  let links = '<a href="index.html">Home</a><a href="services.html">Find Services</a>';
  if (user) {
    links += '<a href="' + dashboards[user.role] + '">Dashboard</a>' +
             '<a href="profile.html">My Profile</a>' +
             '<a href="#" id="logout-link" class="btn btn-small btn-light">Logout (' + esc(user.name) + ')</a>';
  } else {
    links += '<a href="login.html">Login</a><a href="register.html" class="btn btn-small btn-light">Register</a>';
  }

  const nav = document.getElementById('navbar');
  if (nav) {
    nav.innerHTML = '<div class="container nav-inner"><a class="brand" href="index.html">🛠️ NikotSheba</a>' +
                    '<nav class="nav-links">' + links + '</nav></div>';
  }
  const footer = document.getElementById('footer');
  if (footer) {
    footer.innerHTML = '<div class="container">&copy; ' + new Date().getFullYear() +
                       ' ServiceHub &mdash; Local Service Provider Directory</div>';
  }

  const logout = document.getElementById('logout-link');
  if (logout) {
    logout.addEventListener('click', async function (e) {
      e.preventDefault();
      await api('/api/auth/logout', { method: 'POST' });
      window.location.href = 'login.html';
    });
  }
  return user;
}

// For protected pages: go to login if not logged in / wrong role
async function requireRole(role) {
  const user = await initPage();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  if (role && user.role !== role) {
    window.location.href = 'index.html';
    return null;
  }
  return user;
}

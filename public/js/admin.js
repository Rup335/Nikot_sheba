// Admin panel: overview, users, providers, categories, reviews
(async function () {
  const user = await requireRole('admin');
  if (!user) return;

  const panel = document.getElementById('panel');
  let currentTab = 'overview';

  // ---------- Overview ----------
  async function overview() {
    const s = await api('/api/admin/stats');
    const statusRow = (name) => {
      const f = s.bookings_by_status.find((x) => x.status === name);
      return f ? f.total : 0;
    };
    panel.innerHTML =
      '<div class="stats">' +
        '<div class="stat"><div class="num">' + s.customers + '</div><div class="label">Customers</div></div>' +
        '<div class="stat"><div class="num">' + s.providers + '</div><div class="label">Providers</div></div>' +
        '<div class="stat"><div class="num">' + s.pending_approvals + '</div><div class="label">Pending approvals</div></div>' +
        '<div class="stat"><div class="num">' + s.bookings_total + '</div><div class="label">Bookings</div></div>' +
        '<div class="stat"><div class="num">' + s.reviews + '</div><div class="label">Reviews</div></div>' +
      '</div>' +
      '<h2>Bookings by status</h2>' +
      '<div class="stats">' +
        ['pending', 'accepted', 'completed', 'rejected', 'cancelled'].map((n) =>
          '<div class="stat"><div class="num">' + statusRow(n) + '</div><div class="label">' + n.charAt(0).toUpperCase() + n.slice(1) + '</div></div>'
        ).join('') +
      '</div>' +
      '<h2>Recent bookings</h2>' +
      (s.recent_bookings.length
        ? '<div class="table-wrap"><table><thead><tr><th>#</th><th>Customer</th><th>Provider</th><th>Date &amp; time</th><th>Status</th></tr></thead><tbody>' +
          s.recent_bookings.map((b) =>
            '<tr><td>' + b.id + '</td><td>' + esc(b.customer_name) + '</td><td>' + esc(b.provider_name) + '</td>' +
            '<td>' + fmtDate(b.booking_date) + ' ' + fmtTime(b.booking_time) + '</td><td>' + badge(b.status) + '</td></tr>'
          ).join('') + '</tbody></table></div>'
        : '<div class="empty">No bookings yet.</div>') +
      '<h2>Top rated providers</h2>' +
      (s.top_providers.length
        ? '<div class="table-wrap"><table><thead><tr><th>Provider</th><th>Category</th><th>Rating</th></tr></thead><tbody>' +
          s.top_providers.map((t) =>
            '<tr><td>' + esc(t.name) + '</td><td>' + esc(t.category) + '</td><td>' +
            (t.review_count > 0 ? '<span class="stars">' + stars(t.avg_rating) + '</span> ' + t.avg_rating.toFixed(1) + ' (' + t.review_count + ')' : '<span class="muted">No reviews</span>') +
            '</td></tr>'
          ).join('') + '</tbody></table></div>'
        : '<div class="empty">No approved providers yet.</div>');
  }

  // ---------- Users ----------
  async function users() {
    const list = (await api('/api/admin/users')).users;
    panel.innerHTML = '<div class="table-wrap"><table><thead><tr>' +
      '<th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead><tbody>' +
      list.map((u) => {
        const self = u.id === user.id;
        const actions = self ? '<span class="muted">You</span>' :
          '<div class="actions">' +
          (u.status === 'active'
            ? '<button class="btn btn-small btn-gray" data-act="user-status" data-id="' + u.id + '" data-value="blocked">Block</button>'
            : '<button class="btn btn-small btn-green" data-act="user-status" data-id="' + u.id + '" data-value="active">Unblock</button>') +
          '<button class="btn btn-small btn-red" data-act="user-delete" data-id="' + u.id + '">Delete</button></div>';
        return '<tr><td>' + u.id + '</td><td>' + esc(u.name) + '</td><td>' + esc(u.email) + '</td><td>' + esc(u.phone) + '</td>' +
          '<td>' + esc(u.role) + '</td><td>' + badge(u.status) + '</td><td>' + fmtDate(u.created_at) + '</td><td>' + actions + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  // ---------- Providers ----------
  async function providers() {
    const list = (await api('/api/admin/providers')).providers;
    if (!list.length) { panel.innerHTML = '<div class="empty">No providers yet.</div>'; return; }
    panel.innerHTML = '<div class="table-wrap"><table><thead><tr>' +
      '<th>Provider</th><th>Category</th><th>Area</th><th>Price/hr</th><th>Experience</th><th>Rating</th><th>Approved</th><th>Action</th></tr></thead><tbody>' +
      list.map((p) =>
        '<tr><td><strong>' + esc(p.name) + '</strong><br><span class="muted">' + esc(p.email) + '</span></td>' +
        '<td>' + esc(p.category) + '</td><td>' + esc(p.area) + '</td><td>৳' + p.price_per_hour.toLocaleString() + '</td>' +
        '<td>' + p.experience_years + ' yrs</td>' +
        '<td>' + (p.review_count > 0 ? p.avg_rating.toFixed(1) + ' (' + p.review_count + ')' : '-') + '</td>' +
        '<td>' + (p.approved ? '<span class="badge badge-yes">Yes</span>' : '<span class="badge badge-no">Pending</span>') + '</td>' +
        '<td>' + (p.approved
          ? '<button class="btn btn-small btn-gray" data-act="approve" data-id="' + p.id + '" data-value="0">Unapprove</button>'
          : '<button class="btn btn-small btn-green" data-act="approve" data-id="' + p.id + '" data-value="1">Approve</button>') + '</td></tr>'
      ).join('') + '</tbody></table></div>';
  }

  // ---------- Categories ----------
  async function categories() {
    const list = (await api('/api/categories')).categories;
    panel.innerHTML =
      '<form class="add-form card" id="cat-add-form">' +
        '<div><label>Category name</label><input type="text" id="cat-name" placeholder="e.g. Painter" required></div>' +
        '<div><label>Description</label><input type="text" id="cat-desc" placeholder="Short description"></div>' +
        '<button class="btn" type="submit">Add category</button></form>' +
      '<div class="table-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>Description</th><th>Providers</th><th>Actions</th></tr></thead><tbody>' +
      list.map((c) =>
        '<tr><td>' + c.id + '</td>' +
        '<td><input class="inline" type="text" id="cn-' + c.id + '" value="' + esc(c.name) + '"></td>' +
        '<td><input class="inline" type="text" id="cd-' + c.id + '" value="' + esc(c.description) + '"></td>' +
        '<td>' + c.provider_count + '</td>' +
        '<td><div class="actions"><button class="btn btn-small" data-act="cat-save" data-id="' + c.id + '">Save</button>' +
        '<button class="btn btn-small btn-red" data-act="cat-delete" data-id="' + c.id + '">Delete</button></div></td></tr>'
      ).join('') + '</tbody></table></div>';
  }

  // ---------- Reviews ----------
  async function reviews() {
    const list = (await api('/api/admin/reviews')).reviews;
    if (!list.length) { panel.innerHTML = '<div class="empty">No reviews yet.</div>'; return; }
    panel.innerHTML = '<div class="table-wrap"><table><thead><tr>' +
      '<th>Customer</th><th>Provider</th><th>Rating</th><th>Comment</th><th>Date</th><th>Action</th></tr></thead><tbody>' +
      list.map((r) =>
        '<tr><td>' + esc(r.customer_name) + '</td><td>' + esc(r.provider_name) + '</td>' +
        '<td><span class="stars">' + stars(r.rating) + '</span></td><td>' + esc(r.comment || '') + '</td>' +
        '<td>' + fmtDate(r.created_at) + '</td>' +
        '<td><button class="btn btn-small btn-red" data-act="review-delete" data-id="' + r.id + '">Delete</button></td></tr>'
      ).join('') + '</tbody></table></div>';
  }

  const tabs = { overview: overview, users: users, providers: providers, categories: categories, reviews: reviews };

  async function showTab(name) {
    currentTab = name;
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
    panel.innerHTML = '<div class="loading">Loading...</div>';
    try {
      await tabs[name]();
    } catch (err) {
      panel.innerHTML = '';
      showAlert(err.message, 'error');
    }
  }

  // Run an API call, show the message, reload the current tab
  async function run(url, method, body) {
    try {
      const res = await api(url, { method: method, body: body });
      showAlert(res.message, 'success');
    } catch (err) {
      showAlert(err.message, 'error');
    }
    showTab(currentTab);
  }

  // ---------- Clicks ----------
  document.addEventListener('click', function (e) {
    const tab = e.target.closest('.tab-btn');
    if (tab) { showTab(tab.dataset.tab); return; }

    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const id = btn.dataset.id;
    const act = btn.dataset.act;

    if (act === 'user-status') run('/api/admin/users/' + id + '/status', 'PATCH', { status: btn.dataset.value });
    if (act === 'user-delete' && confirm('Delete this user and all their bookings and reviews?')) run('/api/admin/users/' + id, 'DELETE');
    if (act === 'approve') run('/api/admin/providers/' + id + '/approval', 'PATCH', { approved: btn.dataset.value === '1' });
    if (act === 'cat-save') {
      run('/api/admin/categories/' + id, 'PUT', {
        name: document.getElementById('cn-' + id).value,
        description: document.getElementById('cd-' + id).value
      });
    }
    if (act === 'cat-delete' && confirm('Delete this category?')) run('/api/admin/categories/' + id, 'DELETE');
    if (act === 'review-delete' && confirm('Delete this review?')) run('/api/admin/reviews/' + id, 'DELETE');
  });

  // ---------- Add category form ----------
  document.addEventListener('submit', function (e) {
    if (e.target.id !== 'cat-add-form') return;
    e.preventDefault();
    run('/api/admin/categories', 'POST', {
      name: document.getElementById('cat-name').value,
      description: document.getElementById('cat-desc').value
    });
  });

  showTab('overview');
})();

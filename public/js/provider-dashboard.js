// Provider dashboard: requests, accept / reject / complete, reviews
(async function () {
  const user = await requireRole('provider');
  if (!user) return;

  async function loadSummary() {
    const s = await api('/api/provider/summary');

    const notice = document.getElementById('notice');
    if (!s.has_profile) {
      notice.innerHTML = '<div class="alert alert-error">You have not created your service profile yet. ' +
                         '<a href="provider-profile.html">Create it now</a> so customers can find you.</div>';
    } else if (!s.approved) {
      notice.innerHTML = '<div class="alert alert-info">Your profile is waiting for admin approval. ' +
                         'Customers cannot see it until it is approved.</div>';
    } else {
      notice.innerHTML = '';
    }

    document.getElementById('stats').innerHTML =
      '<div class="stat"><div class="num">' + s.total + '</div><div class="label">Total bookings</div></div>' +
      '<div class="stat"><div class="num">' + s.pending + '</div><div class="label">Pending requests</div></div>' +
      '<div class="stat"><div class="num">' + s.completed + '</div><div class="label">Completed jobs</div></div>' +
      '<div class="stat"><div class="num">' + (s.avg_rating === null ? '-' : s.avg_rating.toFixed(1)) + '</div>' +
      '<div class="label">Average rating (' + s.review_count + ')</div></div>';

    document.getElementById('reviews').innerHTML = s.reviews.length
      ? s.reviews.map((r) =>
          '<div class="review"><span class="stars">' + stars(r.rating) + '</span> <strong>' + esc(r.customer) +
          '</strong> <span class="muted">&middot; ' + fmtDate(r.created_at) + '</span><p>' + esc(r.comment || '') + '</p></div>'
        ).join('')
      : '<p class="muted">No reviews yet.</p>';
  }

  async function loadBookings() {
    const box = document.getElementById('bookings');
    const list = (await api('/api/bookings')).bookings;
    if (!list.length) {
      box.innerHTML = '<div class="empty">No booking requests yet.</div>';
      return;
    }
    box.innerHTML = '<div class="table-wrap"><table><thead><tr>' +
      '<th>Customer</th><th>Date &amp; time</th><th>Address / note</th><th>Status</th><th>Action</th></tr></thead><tbody>' +
      list.map((b) => {
        let action = '';
        if (b.status === 'pending') {
          action = '<div class="actions">' +
            '<button class="btn btn-small btn-green" data-status="accepted" data-id="' + b.id + '">Accept</button>' +
            '<button class="btn btn-small btn-red" data-status="rejected" data-id="' + b.id + '">Reject</button></div>';
        } else if (b.status === 'accepted') {
          action = '<button class="btn btn-small" data-status="completed" data-id="' + b.id + '">Mark completed</button>';
        }
        return '<tr><td><strong>' + esc(b.customer_name) + '</strong><br><span class="muted">' + esc(b.customer_phone) + '</span></td>' +
          '<td>' + fmtDate(b.booking_date) + '<br><span class="muted">' + fmtTime(b.booking_time) + '</span></td>' +
          '<td>' + esc(b.address) + (b.note ? '<br><span class="muted">' + esc(b.note) + '</span>' : '') + '</td>' +
          '<td>' + badge(b.status) + '</td><td>' + action + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  async function loadAll() {
    try {
      await loadSummary();
      await loadBookings();
    } catch (err) {
      showAlert(err.message, 'error');
    }
  }

  document.addEventListener('click', async function (e) {
    const btn = e.target.closest('[data-status]');
    if (!btn) return;
    try {
      const res = await api('/api/bookings/' + btn.dataset.id + '/status', {
        method: 'PATCH', body: { status: btn.dataset.status }
      });
      showAlert(res.message, 'success');
      loadAll();
    } catch (err) {
      showAlert(err.message, 'error');
    }
  });

  loadAll();
})();

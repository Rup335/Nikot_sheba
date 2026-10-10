// Customer dashboard: my bookings, cancel, write review
(async function () {
  const user = await requireRole('customer');
  if (!user) return;

  async function load() {
    const box = document.getElementById('bookings');
    try {
      const list = (await api('/api/bookings')).bookings;

      const count = (s) => list.filter((b) => b.status === s).length;
      document.getElementById('stats').innerHTML =
        '<div class="stat"><div class="num">' + list.length + '</div><div class="label">Total bookings</div></div>' +
        '<div class="stat"><div class="num">' + count('pending') + '</div><div class="label">Pending</div></div>' +
        '<div class="stat"><div class="num">' + count('accepted') + '</div><div class="label">Accepted</div></div>' +
        '<div class="stat"><div class="num">' + count('completed') + '</div><div class="label">Completed</div></div>';

      if (!list.length) {
        box.innerHTML = '<div class="empty">You have no bookings yet. <a href="services.html">Find a service</a></div>';
        return;
      }

      box.innerHTML = '<div class="table-wrap"><table><thead><tr>' +
        '<th>Provider</th><th>Date &amp; time</th><th>Address</th><th>Status</th><th>Action</th></tr></thead><tbody>' +
        list.map((b) => {
          let action = '';
          if (b.status === 'pending' || b.status === 'accepted') {
            action = '<button class="btn btn-small btn-red" data-action="cancel" data-id="' + b.id + '">Cancel</button>';
          } else if (b.status === 'completed' && b.rating) {
            action = '<span class="stars">' + stars(b.rating) + '</span><br><span class="muted">Reviewed</span>';
          } else if (b.status === 'completed') {
            action = '<details><summary>Write review</summary>' +
              '<form class="review-form" data-id="' + b.id + '">' +
              '<label>Rating</label><select name="rating">' +
              '<option value="5">5 - Excellent</option><option value="4">4 - Good</option><option value="3">3 - Average</option>' +
              '<option value="2">2 - Poor</option><option value="1">1 - Very bad</option></select>' +
              '<label>Comment</label><textarea name="comment" placeholder="Share your experience"></textarea>' +
              '<button class="btn btn-small" type="submit" style="margin-top:8px;">Submit review</button></form></details>';
          }
          return '<tr><td><a href="provider.html?id=' + b.provider_id + '"><strong>' + esc(b.provider_name) + '</strong></a>' +
            '<br><span class="muted">' + esc(b.category || '') + ' &middot; ' + esc(b.provider_phone) + '</span></td>' +
            '<td>' + fmtDate(b.booking_date) + '<br><span class="muted">' + fmtTime(b.booking_time) + '</span></td>' +
            '<td>' + esc(b.address) + (b.note ? '<br><span class="muted">' + esc(b.note) + '</span>' : '') + '</td>' +
            '<td>' + badge(b.status) + '</td><td>' + action + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    } catch (err) {
      box.innerHTML = '';
      showAlert(err.message, 'error');
    }
  }

  document.addEventListener('click', async function (e) {
    const btn = e.target.closest('[data-action="cancel"]');
    if (!btn) return;
    if (!confirm('Cancel this booking?')) return;
    try {
      const res = await api('/api/bookings/' + btn.dataset.id + '/status', { method: 'PATCH', body: { status: 'cancelled' } });
      showAlert(res.message, 'success');
      load();
    } catch (err) {
      showAlert(err.message, 'error');
    }
  });

  document.addEventListener('submit', async function (e) {
    const form = e.target.closest('.review-form');
    if (!form) return;
    e.preventDefault();
    try {
      const res = await api('/api/reviews', {
        method: 'POST',
        body: { booking_id: form.dataset.id, rating: form.rating.value, comment: form.comment.value }
      });
      showAlert(res.message, 'success');
      load();
    } catch (err) {
      showAlert(err.message, 'error');
    }
  });

  load();
})();

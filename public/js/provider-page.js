// Public provider profile: details, reviews and booking form
(async function () {
  const user = await initPage();
  const id = getParam('id');
  const content = document.getElementById('content');

  let data;
  try {
    data = await api('/api/providers/' + encodeURIComponent(id));
  } catch (err) {
    content.innerHTML = '<div class="alert alert-error">' + esc(err.message) + '</div>' +
                        '<a class="btn" href="services.html">Back to services</a>';
    return;
  }
  const p = data.provider;
  document.title = p.name + ' | ServiceHub';

  const ratingHtml = p.review_count > 0
    ? '<span class="stars">' + stars(p.avg_rating) + '</span> <strong>' + p.avg_rating.toFixed(1) +
      '</strong> <span class="muted">(' + p.review_count + ' reviews)</span>'
    : '<span class="muted">No reviews yet</span>';

  const reviewsHtml = data.reviews.length
    ? data.reviews.map((r) =>
        '<div class="review"><span class="stars">' + stars(r.rating) + '</span> ' +
        '<strong>' + esc(r.customer) + '</strong> <span class="muted">&middot; ' + fmtDate(r.created_at) + '</span>' +
        '<p>' + esc(r.comment || '') + '</p></div>').join('')
    : '<p class="muted">No reviews yet. Be the first to review after your booking is completed.</p>';

  // Booking box depends on who is looking at the page
  let bookingHtml;
  if (!p.approved) {
    bookingHtml = '<div class="alert alert-info">This profile is waiting for admin approval.</div>';
  } else if (!user) {
    bookingHtml = '<h3>Book this provider</h3><p class="muted" style="margin:8px 0 14px;">Please login as a customer to book.</p>' +
                  '<a class="btn" href="login.html">Login</a> <a class="btn btn-light" style="border:1px solid #2563eb" href="register.html">Register</a>';
  } else if (user.role !== 'customer') {
    bookingHtml = '<div class="alert alert-info">Only customer accounts can book services.</div>';
  } else {
    bookingHtml = '<h3>Book this provider</h3>' +
      '<form id="booking-form">' +
      '<label>Date</label><input type="date" id="b-date" min="' + todayISO() + '" required>' +
      '<label>Time</label><input type="time" id="b-time" required>' +
      '<label>Service address</label><input type="text" id="b-address" placeholder="House, road, area" required>' +
      '<label>Note (optional)</label><textarea id="b-note" placeholder="Describe the work"></textarea>' +
      '<button class="btn" type="submit" style="width:100%;margin-top:16px;">Send booking request</button></form>';
  }

  content.innerHTML =
    '<div class="profile-layout">' +
      '<div>' +
        '<div class="card">' +
          '<div class="card-top"><h1>' + esc(p.name) + '</h1><span class="tag">' + esc(p.category) + '</span></div>' +
          '<p>' + ratingHtml + '</p>' +
          '<p class="muted">📍 ' + esc(p.area) + ' &nbsp;|&nbsp; 💼 ' + p.experience_years + ' years experience</p>' +
          '<p class="price" style="margin:10px 0;">৳' + p.price_per_hour.toLocaleString() + ' <small>/ hour</small></p>' +
          (p.phone ? '<p>📞 ' + esc(p.phone) + '</p>' : '<p class="muted">Login to see the phone number.</p>') +
          '<h3 style="margin-top:14px;">About</h3><p>' + esc(p.bio || 'No description added.') + '</p>' +
        '</div>' +
        '<h2>Reviews</h2><div class="card">' + reviewsHtml + '</div>' +
      '</div>' +
      '<div class="card">' + bookingHtml + '</div>' +
    '</div>';

  const form = document.getElementById('booking-form');
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      try {
        const res = await api('/api/bookings', {
          method: 'POST',
          body: {
            provider_id: p.id,
            booking_date: document.getElementById('b-date').value,
            booking_time: document.getElementById('b-time').value,
            address: document.getElementById('b-address').value,
            note: document.getElementById('b-note').value
          }
        });
        showAlert(res.message + ' Check "My Bookings" in your dashboard.', 'success');
        form.reset();
      } catch (err) {
        showAlert(err.message, 'error');
      }
    });
  }
})();

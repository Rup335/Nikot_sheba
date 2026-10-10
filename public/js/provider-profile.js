// Provider edits their service profile
(async function () {
  const user = await requireRole('provider');
  if (!user) return;

  try {
    const cats = (await api('/api/categories')).categories;
    document.getElementById('category').innerHTML = cats
      .map((c) => '<option value="' + c.id + '">' + esc(c.name) + '</option>').join('');

    const profile = (await api('/api/provider/profile')).profile;
    if (profile) {
      document.getElementById('category').value = profile.category_id;
      document.getElementById('area').value = profile.area;
      document.getElementById('price').value = profile.price_per_hour;
      document.getElementById('experience').value = profile.experience_years;
      document.getElementById('bio').value = profile.bio || '';
      document.getElementById('status-note').innerHTML = profile.approved
        ? '<span class="badge badge-yes">Approved - visible to customers</span>'
        : '<span class="badge badge-no">Waiting for admin approval</span>';
    }
  } catch (err) {
    showAlert(err.message, 'error');
  }

  document.getElementById('profile-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      const res = await api('/api/provider/profile', {
        method: 'PUT',
        body: {
          category_id: document.getElementById('category').value,
          area: document.getElementById('area').value,
          price_per_hour: document.getElementById('price').value,
          experience_years: document.getElementById('experience').value,
          bio: document.getElementById('bio').value
        }
      });
      showAlert(res.message, 'success');
    } catch (err) {
      showAlert(err.message, 'error');
    }
  });
})();

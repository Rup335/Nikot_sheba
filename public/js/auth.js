// Login and Register pages
(async function () {
  const user = await initPage();
  const dashboards = { customer: 'customer.html', provider: 'provider-dashboard.html', admin: 'admin.html' };
  if (user) {
    window.location.href = dashboards[user.role];
    return;
  }

  // ---------- Login ----------
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      try {
        const res = await api('/api/auth/login', {
          method: 'POST',
          body: {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
          }
        });
        window.location.href = dashboards[res.user.role];
      } catch (err) {
        showAlert(err.message, 'error');
      }
    });
  }

  // ---------- Register ----------
  const regForm = document.getElementById('register-form');
  if (regForm) {
    const roleSelect = document.getElementById('role');
    const providerBox = document.getElementById('provider-fields');

    try {
      const cats = (await api('/api/categories')).categories;
      document.getElementById('category').innerHTML = cats
        .map((c) => '<option value="' + c.id + '">' + esc(c.name) + '</option>').join('');
    } catch (err) {
      showAlert(err.message, 'error');
    }

    roleSelect.addEventListener('change', function () {
      providerBox.classList.toggle('hidden', roleSelect.value !== 'provider');
    });

    regForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (document.getElementById('password').value !== document.getElementById('confirm').value) {
        showAlert('Passwords do not match.', 'error');
        return;
      }
      const body = {
        role: roleSelect.value,
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
      };
      if (body.role === 'provider') {
        body.category_id = document.getElementById('category').value;
        body.area = document.getElementById('area').value;
        body.price_per_hour = document.getElementById('price').value;
        body.experience_years = document.getElementById('experience').value;
        body.bio = document.getElementById('bio').value;
      }
      try {
        const res = await api('/api/auth/register', { method: 'POST', body: body });
        alert(res.message);
        window.location.href = 'login.html';
      } catch (err) {
        showAlert(err.message, 'error');
      }
    });
  }
})();

// My Profile page (all roles)
(async function () {
  const user = await requireRole(null);
  if (!user) return;

  document.getElementById('email').value = user.email;
  document.getElementById('role').value = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  document.getElementById('name').value = user.name;
  document.getElementById('phone').value = user.phone;

  document.getElementById('profile-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      const res = await api('/api/auth/profile', {
        method: 'PUT',
        body: { name: document.getElementById('name').value, phone: document.getElementById('phone').value }
      });
      showAlert(res.message, 'success');
      await initPage(); // refresh the name in the menu
    } catch (err) {
      showAlert(err.message, 'error');
    }
  });

  document.getElementById('password-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      const res = await api('/api/auth/password', {
        method: 'PUT',
        body: { current_password: document.getElementById('current').value, new_password: document.getElementById('new').value }
      });
      showAlert(res.message, 'success');
      e.target.reset();
    } catch (err) {
      showAlert(err.message, 'error');
    }
  });
})();

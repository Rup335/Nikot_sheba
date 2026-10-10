// Home page
(async function () {
  await initPage();
  const icons = { 'Electrician': '💡', 'Plumber': '🚰', 'Tutor': '📚', 'Cleaner': '🧹', 'Carpenter': '🪚', 'AC Repair': '❄️' };

  try {
    const cats = (await api('/api/categories')).categories;
    document.getElementById('hero-category').innerHTML += cats
      .map((c) => '<option value="' + c.id + '">' + esc(c.name) + '</option>').join('');

    document.getElementById('categories').innerHTML = cats.map((c) =>
      '<a class="card category-card" href="services.html?category=' + c.id + '">' +
      '<div class="icon">' + (icons[c.name] || '🔧') + '</div><h3>' + esc(c.name) + '</h3>' +
      '<p class="muted">' + esc(c.description) + '</p>' +
      '<p class="muted"><strong>' + c.provider_count + '</strong> providers</p></a>'
    ).join('') || '<div class="empty">No categories yet.</div>';

    const top = (await api('/api/providers?sort=rating&limit=3')).providers;
    document.getElementById('top-providers').innerHTML =
      top.map(providerCard).join('') || '<div class="empty">No providers available yet.</div>';
  } catch (err) {
    showAlert(err.message, 'error');
  }
})();

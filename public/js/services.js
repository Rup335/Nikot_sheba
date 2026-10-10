// Search / filter page
(async function () {
  await initPage();

  // Fill filters from the URL (when coming from the home page)
  document.getElementById('f-q').value = getParam('q') || '';
  document.getElementById('f-area').value = getParam('area') || '';
  document.getElementById('f-sort').value = getParam('sort') || 'rating';

  try {
    const cats = (await api('/api/categories')).categories;
    document.getElementById('f-category').innerHTML += cats
      .map((c) => '<option value="' + c.id + '">' + esc(c.name) + '</option>').join('');
    document.getElementById('f-category').value = getParam('category') || '0';
  } catch (err) {
    showAlert(err.message, 'error');
  }

  async function search() {
    const params = new URLSearchParams({
      q: document.getElementById('f-q').value.trim(),
      category: document.getElementById('f-category').value,
      area: document.getElementById('f-area').value.trim(),
      sort: document.getElementById('f-sort').value
    });
    const box = document.getElementById('results');
    box.innerHTML = '<div class="loading">Loading...</div>';
    try {
      const list = (await api('/api/providers?' + params.toString())).providers;
      document.getElementById('result-count').textContent = list.length + ' provider(s) found';
      box.innerHTML = list.length
        ? list.map(providerCard).join('')
        : '<div class="empty" style="grid-column:1/-1">No providers match your search. Try a different service or area.</div>';
    } catch (err) {
      box.innerHTML = '';
      showAlert(err.message, 'error');
    }
  }

  document.getElementById('filter-form').addEventListener('submit', function (e) {
    e.preventDefault();
    search();
  });
  search();
})();

document.addEventListener('DOMContentLoaded', () => {
  const body = document.querySelector('#transactions-body'); if (!body) return;
  const search = document.querySelector('#transaction-search'), type = document.querySelector('#transaction-type'), prev = document.querySelector('#prev-page'), next = document.querySelector('#next-page'), label = document.querySelector('#page-label'); let page = 1, pages = 1;
  async function load() {
    try {
      const d = await Veloop.request(`/api/transactions?page=${page}&type=${encodeURIComponent(type.value)}&q=${encodeURIComponent(search.value)}`);
      pages = d.pages; label.textContent = `Page ${d.page} of ${d.pages} · ${d.total} transactions`; prev.disabled = page <= 1; next.disabled = page >= pages; body.innerHTML = '';
      d.items.forEach(t => { const tr = document.createElement('tr'); tr.innerHTML = `<td>${esc(t.transaction_code)}</td><td>${esc(t.type)}</td><td>${esc(t.description)}</td><td class="${t.gems_delta_cents >= 0 ? 'amount-positive':'amount-negative'}">${t.gems ? (t.gems > 0 ? '+' : '') + Veloop.money(t.gems) : '—'}</td><td class="${t.ves_delta_cents >= 0 ? 'amount-positive':'amount-negative'}">${t.ves ? (t.ves > 0 ? '+' : '') + Veloop.money(t.ves) : '—'}</td><td>${esc(t.created_at)}</td><td><span class="pill success">${esc(t.status)}</span></td>`; body.appendChild(tr); });
      if (!d.items.length) body.innerHTML = '<tr><td colspan="7" class="empty">No transactions found.</td></tr>';
    } catch(e) { body.innerHTML = `<tr><td colspan="7" class="empty">${esc(e.message)}</td></tr>`; }
  }
  search.addEventListener('input', () => { page = 1; load(); }); type.addEventListener('change', () => { page = 1; load(); });
  prev.addEventListener('click', () => { page = Math.max(1, page - 1); load(); }); next.addEventListener('click', () => { page = Math.min(pages, page + 1); load(); }); load();
});
function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

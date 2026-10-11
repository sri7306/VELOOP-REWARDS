document.addEventListener('DOMContentLoaded', async () => {
  const root = document.querySelector('#wallet-data'); if (!root) return;
  try {
    const [w, h] = await Promise.all([Veloop.request('/api/wallet'), Veloop.request('/api/wallet/history')]);
    for (const [key, value] of Object.entries(w)) { const el = root.querySelector(`[data-wallet="${key}"]`); if (el) el.textContent = typeof value === 'number' ? Veloop.money(value) : value; }
    const body = root.querySelector('tbody'); body.innerHTML = '';
    h.items.forEach(t => { const tr = document.createElement('tr'); tr.innerHTML = `<td>${esc(t.transaction_code)}</td><td>${esc(t.type)}</td><td>${esc(t.description)}</td><td>${t.gems ? Veloop.money(t.gems) : '—'}</td><td>${t.ves ? Veloop.money(t.ves) : '—'}</td><td>${esc(t.created_at)}</td>`; body.appendChild(tr); });
    if (!h.items.length) body.innerHTML = '<tr><td colspan="6" class="empty">No wallet activity yet.</td></tr>';
  } catch(e) { Veloop.toast(e.message, 'error'); }
});
function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

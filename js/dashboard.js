document.addEventListener('DOMContentLoaded', async () => {
  if (!document.querySelector('#dashboard-data')) return;
  const root = document.querySelector('#dashboard-data');
  try {
    const d = await Veloop.request('/api/dashboard');
    root.querySelector('[data-gems]').textContent = Veloop.money(d.wallet.gems);
    root.querySelector('[data-ves]').textContent = Veloop.money(d.wallet.ves);
    root.querySelector('[data-rewards]').textContent = d.rewardsRedeemed;
    root.querySelector('[data-rate]').textContent = `1 Gem = ${d.rate.toFixed(2)} VEs`;
    root.querySelector('[data-welcome]').textContent = `Welcome back, ${d.user.first_name}.`;
    const body = root.querySelector('[data-recent]');
    body.innerHTML = '';
    d.recentTransactions.forEach(t => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${escapeHTML(t.transaction_code)}</td><td>${escapeHTML(t.type)}</td><td>${escapeHTML(t.description)}</td><td>${t.gems > 0 ? '+' : ''}${Veloop.money(t.gems)} Gems</td><td><span class="pill success">${escapeHTML(t.status)}</span></td>`;
      body.appendChild(tr);
    });
    if (!d.recentTransactions.length) body.innerHTML = '<tr><td colspan="5" class="empty">Your recent transactions will appear here.</td></tr>';
  } catch (e) { Veloop.toast(e.message, 'error'); }
});
function escapeHTML(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

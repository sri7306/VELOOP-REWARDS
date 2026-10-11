document.addEventListener('DOMContentLoaded', () => {
  const grid = document.querySelector('#rewards-grid'); if (!grid) return;
  const search = document.querySelector('#reward-search'); let category = 'All';
  async function load() {
    grid.innerHTML = '<div class="empty">Loading rewards...</div>';
    try {
      const data = await Veloop.request(`/api/rewards?category=${encodeURIComponent(category)}&q=${encodeURIComponent(search.value)}`);
      grid.innerHTML = '';
      data.rewards.forEach(r => {
        const card = document.createElement('article'); card.className = 'card reward-card';
        card.innerHTML = `<div class="reward-art"><span>${escapeHTML(r.imageLabel)}</span></div><div><span class="pill">${escapeHTML(r.category)}</span></div><h3>${escapeHTML(r.name)}</h3><p>${escapeHTML(r.description)}</p><div class="reward-bottom"><strong><img class="asset-icon" style="width:24px;height:24px;vertical-align:middle" src="assets/svg/ve(4).svg" alt="VEs"> ${Veloop.money(r.costVes)} VEs</strong><button class="btn btn-primary" data-redeem="${r.id}" ${r.stock < 1 ? 'disabled' : ''}>Redeem</button></div>`;
        grid.appendChild(card);
      });
      if (!data.rewards.length) grid.innerHTML = '<div class="empty">No rewards match your search.</div>';
      grid.querySelectorAll('[data-redeem]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('Redeem this reward using your VEs?')) return;
        b.disabled = true;
        try { const result = await Veloop.request(`/api/rewards/${b.dataset.redeem}/redeem`, { method: 'POST', body: {} }); Veloop.toast(result.message); load(); }
        catch(e) { Veloop.toast(e.message, 'error'); b.disabled = false; }
      }));
    } catch(e) { grid.innerHTML = `<div class="empty">${escapeHTML(e.message)}</div>`; }
  }
  document.querySelectorAll('[data-category]').forEach(b => b.addEventListener('click', () => { category = b.dataset.category; document.querySelectorAll('[data-category]').forEach(x => x.classList.toggle('active', x === b)); load(); }));
  search.addEventListener('input', load); load();
});
function escapeHTML(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

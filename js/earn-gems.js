document.addEventListener('DOMContentLoaded', () => {
  const grid = document.querySelector('#earn-grid'); if (!grid) return;
  async function load() {
    try {
      const data = await Veloop.request('/api/earn-gems'); grid.innerHTML = '';
      data.activities.forEach(a => {
        const card = document.createElement('article'); card.className = 'card activity-card';
        card.innerHTML = `<div class="activity-mark"><img class="asset-icon" src="assets/svg/gem(4).svg" alt="Gems"></div><div style="flex:1"><h3>${esc(a.name)}</h3><p>${esc(a.description)}</p><div class="stat-foot">${a.frequency === 'daily' ? 'Available daily' : 'One-time activity'}</div><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:14px"><strong>+${Veloop.money(a.rewardGems)} Gems</strong><button class="btn ${a.claimed ? 'btn-secondary' : 'btn-primary'}" data-claim="${a.id}" ${a.claimed ? 'disabled' : ''}>${a.claimed ? 'Claimed' : 'Claim reward'}</button></div></div>`;
        grid.appendChild(card);
      });
      grid.querySelectorAll('[data-claim]').forEach(b => b.addEventListener('click', async () => {
        b.disabled = true;
        try { const result = await Veloop.request('/api/earn-gems/claim', { method: 'POST', body: { activityId: Number(b.dataset.claim) } }); Veloop.toast(result.message); load(); }
        catch(e) { Veloop.toast(e.message, 'error'); b.disabled = false; }
      }));
    } catch(e) { grid.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
  }
  load();
});
function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

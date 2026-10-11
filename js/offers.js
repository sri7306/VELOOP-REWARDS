document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('#offers-grid'); if (!root) return;
  async function load() {
    try {
      const d = await Veloop.request('/api/offers'); root.innerHTML = '';
      d.offers.forEach(o => {
        const card = document.createElement('article'); card.className = 'card';
        card.innerHTML = `<span class="pill">Special offer</span><h3 style="margin-top:14px">${esc(o.title)}</h3><p>${esc(o.description)}</p><div class="list-row"><span>Reward</span><strong><img class="asset-icon" style="width:22px;height:22px;vertical-align:middle" src="assets/svg/gem(4).svg" alt="Gems"> ${Veloop.money(o.rewardGems)} Gems</strong></div><div class="list-row"><span>Expiry</span><span>${esc(o.expiresAt)}</span></div><button class="btn ${o.claimed?'btn-secondary':'btn-primary'} btn-block" data-offer="${o.id}" ${o.claimed?'disabled':''}>${o.claimed?'Claimed':'Claim offer'}</button>`;
        root.appendChild(card);
      });
      root.querySelectorAll('[data-offer]').forEach(b => b.addEventListener('click', async () => {
        b.disabled = true;
        try { const r = await Veloop.request(`/api/offers/${b.dataset.offer}/claim`, {method:'POST',body:{}}); Veloop.toast(r.message); load(); }
        catch(e) { Veloop.toast(e.message, 'error'); b.disabled = false; }
      }));
    } catch(e) { root.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
  }
  load();
});
function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

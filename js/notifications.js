document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('#notifications-list'); if (!root) return;
  async function load() {
    try {
      const d = await Veloop.request('/api/notifications'); root.innerHTML = '';
      d.notifications.forEach(n => {
        const row = document.createElement('article'); row.className = 'card'; row.style.marginBottom = '12px';
        row.innerHTML = `<div style="display:flex;gap:14px;align-items:flex-start"><div class="activity-mark">N</div><div style="flex:1"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><h3>${esc(n.title)}</h3><span class="pill ${n.is_read ? 'muted':'success'}">${n.is_read ? 'Read':'Unread'}</span></div><p>${esc(n.message)}</p><div class="stat-foot">${esc(n.created_at)}</div></div>${n.is_read ? '' : `<button class="btn btn-secondary" data-read="${n.id}">Mark as read</button>`}</div>`;
        root.appendChild(row);
      });
      if (!d.notifications.length) root.innerHTML = '<div class="empty">You are all caught up. New notifications will appear here.</div>';
      root.querySelectorAll('[data-read]').forEach(b => b.addEventListener('click', async () => { try { await Veloop.request(`/api/notifications/${b.dataset.read}/read`, { method:'PATCH', body:{} }); load(); } catch(e) { Veloop.toast(e.message, 'error'); } }));
    } catch(e) { root.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
  }
  document.querySelector('[data-read-all]')?.addEventListener('click', async () => { try { await Veloop.request('/api/notifications/read-all', { method:'PATCH', body:{} }); load(); } catch(e) { Veloop.toast(e.message, 'error'); } });
  load();
});
function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

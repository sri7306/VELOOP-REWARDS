document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#password-form');
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('[type=submit]'); btn.disabled = true;
    try {
      const r = await Veloop.request('/api/security/change-password', { method:'POST', body:{ currentPassword:form.currentPassword.value, newPassword:form.newPassword.value, confirmPassword:form.confirmPassword.value } });
      Veloop.showNotice(form.querySelector('.notice'), r.message); form.reset();
    } catch(err) { Veloop.showNotice(form.querySelector('.notice'), err.message, 'error'); }
    finally { btn.disabled = false; }
  });
  const activity = document.querySelector('#login-activity');
  if (activity) Veloop.request('/api/security/login-activity').then(d => {
    activity.innerHTML = d.items.map(x => `<div class="list-row"><span>${esc(x.event)}</span><span class="muted small">${esc(x.created_at)}</span></div>`).join('') || '<p>No login activity yet.</p>';
  }).catch(e => activity.textContent = e.message);
});
function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

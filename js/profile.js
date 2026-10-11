document.addEventListener('DOMContentLoaded', async () => {
  const form = document.querySelector('#profile-form'); if (!form) return;
  try {
    const d = await Veloop.request('/api/profile'); const u = d.user;
    for (const [field, value] of Object.entries({ firstName:u.first_name, lastName:u.last_name, username:u.username, email:u.email, mobile:u.mobile, country:u.country || '' })) if (form[field]) form[field].value = value;
    form.username.readOnly = true; form.email.readOnly = true;
  } catch(e) { Veloop.toast(e.message, 'error'); }
  form.addEventListener('submit', async e => {
    e.preventDefault(); const btn = form.querySelector('[type=submit]'); btn.disabled = true;
    try { const r = await Veloop.request('/api/profile', { method:'PATCH', body:{ firstName:form.firstName.value, lastName:form.lastName.value, mobile:form.mobile.value, country:form.country.value } }); Veloop.showNotice(form.querySelector('.notice'), r.message); }
    catch(err) { Veloop.showNotice(form.querySelector('.notice'), err.message, 'error'); }
    finally { btn.disabled = false; }
  });
});

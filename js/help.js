document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#support-form'); if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault(); const btn = form.querySelector('[type=submit]'); btn.disabled = true;
    try {
      const r = await Veloop.request('/api/help/tickets', {method:'POST', body:{name:form.name.value,email:form.email.value,subject:form.subject.value,message:form.message.value}});
      Veloop.showNotice(form.querySelector('.notice'), r.message); form.reset();
    } catch(err) { Veloop.showNotice(form.querySelector('.notice'), err.message, 'error'); }
    finally { btn.disabled = false; }
  });
});

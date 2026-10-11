document.addEventListener('DOMContentLoaded', async () => {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  const menu = document.querySelector('.mobile-menu');
  const close = () => { sidebar?.classList.remove('open'); overlay?.classList.remove('show'); };
  menu?.addEventListener('click', () => { sidebar?.classList.toggle('open'); overlay?.classList.toggle('show'); });
  overlay?.addEventListener('click', close);
  document.querySelectorAll('[data-logout]').forEach(b => b.addEventListener('click', () => Veloop.logout()));
  document.querySelectorAll('.dropdown-toggle').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); b.closest('.dropdown')?.classList.toggle('open'); }));
  document.addEventListener('click', e => { if (!e.target.closest('.dropdown')) document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open')); });
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.side-nav a').forEach(a => { if (a.getAttribute('href') === page) a.classList.add('active'); });
  if (document.body.dataset.protected === 'true') await Veloop.protectPage();
  try {
    const { user } = await Veloop.request('/api/auth/me');
    document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = user.first_name || user.username);
    document.querySelectorAll('[data-user-initial]').forEach(el => el.textContent = (user.first_name || user.username || 'V').slice(0,1).toUpperCase());
  } catch {}
});

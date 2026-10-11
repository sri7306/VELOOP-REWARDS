document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#exchange-form'); if (!form) return;
  const input = form.gemsAmount, output = document.querySelector('[data-output-ves]'), rateEl = document.querySelector('[data-exchange-rate]');
  let rate = 5.39, preview = null;
  const update = () => { const n = Math.max(0, Number(input.value) || 0); output.textContent = Veloop.money(n * rate); };
  Veloop.request('/api/exchange/rate').then(d => { rate = d.rate; rateEl.textContent = `1 Gem = ${rate.toFixed(2)} VEs`; update(); }).catch(() => {});
  input.addEventListener('input', update);
  form.querySelector('[data-max]').addEventListener('click', async () => {
    try { const w = await Veloop.request('/api/wallet'); input.value = w.gems.toFixed(2); update(); }
    catch(e) { Veloop.toast(e.message, 'error'); }
  });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    try {
      preview = await Veloop.request('/api/exchange/preview', { method: 'POST', body: { gems: input.value } });
      document.querySelector('[data-preview-gems]').textContent = Veloop.money(preview.gems);
      document.querySelector('[data-preview-ves]').textContent = Veloop.money(preview.ves);
      document.querySelector('[data-preview-rate]').textContent = preview.rate.toFixed(2);
      document.querySelector('#exchange-modal').classList.add('open');
    } catch(err) { Veloop.toast(err.message, 'error'); }
  });
  document.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', () => b.closest('.modal-backdrop').classList.remove('open')));
  document.querySelector('[data-confirm-exchange]').addEventListener('click', async e => {
    if (!preview) return;
    const btn = e.currentTarget; btn.disabled = true;
    try {
      const result = await Veloop.request('/api/exchange/confirm', { method: 'POST', body: { gems: preview.gems } });
      document.querySelector('#exchange-modal').classList.remove('open');
      Veloop.toast(result.message);
      input.value = ''; update();
      document.querySelector('[data-current-gems]').textContent = Veloop.money(result.wallet.gems);
      document.querySelector('[data-current-ves]').textContent = Veloop.money(result.wallet.ves);
      preview = null;
    } catch(err) { Veloop.toast(err.message, 'error'); }
    finally { btn.disabled = false; }
  });
  document.querySelectorAll('[data-plan-amount]').forEach(b => b.addEventListener('click', () => { input.value = b.dataset.planAmount; update(); input.focus(); }));
});

window.Veloop = (() => {
  async function request(url, options = {}) {
    const opts = {
      credentials: 'same-origin',
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {})
      }
    };

    if (opts.body && typeof opts.body !== 'string') {
      opts.body = JSON.stringify(opts.body);
    }

    const response = await fetch(url, opts);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.error ||
        data.message ||
        'Something went wrong. Please try again.'
      );
    }

    return data;
  }

  function money(value) {
    return Number(value || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function toast(message, type = 'success') {
    let region = document.querySelector('.toast-region');

    if (!region) {
      region = document.createElement('div');
      region.className = 'toast-region';
      region.setAttribute('aria-live', 'polite');
      document.body.appendChild(region);
    }

    const item = document.createElement('div');
    item.className = `toast ${type}`;
    item.textContent = String(message ?? '');
    region.appendChild(item);

    setTimeout(() => item.remove(), 4200);
  }

function showNotice(element, message, type = 'success') {
  if (!element) {
    console.error(
      'VELOOP DEBUG: showNotice received a null element.',
      {
        message: message,
        type: type,
        currentPage: window.location.href
      }
    );
    return;
  }

  element.textContent = String(message ?? '');
  element.className = `notice show ${type}`;
}


  async function protectPage() {
    try {
      return await request('/api/auth/me');
    } catch (error) {
      location.href = 'login.html';
      return null;
    }
  }

  async function logout() {
    try {
      await request('/api/auth/logout', {
        method: 'POST'
      });
    } finally {
      location.href = 'login.html';
    }
  }

  return {
    request,
    money,
    toast,
    showNotice,
    protectPage,
    logout
  };
})();
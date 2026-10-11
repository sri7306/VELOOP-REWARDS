document.addEventListener('DOMContentLoaded', () => {
  // LOGIN FORM
  const login = document.querySelector('#login-form');

  if (login) {
    login.addEventListener('submit', async (event) => {
      event.preventDefault();

      const button = login.querySelector('[type="submit"]');
      const notice = login.querySelector('.notice');
      const identity = login.querySelector('[name="identity"]');
      const password = login.querySelector('[name="password"]');

      if (!identity || !password) {
        console.error('VELOOP: Login form fields are missing.');
        Veloop.showNotice(
          notice,
          'Login form is incomplete. Please refresh the page.',
          'error'
        );
        return;
      }

      if (button) button.disabled = true;

      try {
        await Veloop.request('/api/auth/login', {
          method: 'POST',
          body: {
            identity: identity.value.trim(),
            password: password.value
          }
        });

        location.href = 'dashboard.html';
      } catch (error) {
        Veloop.showNotice(
          notice,
          error.message || 'Login failed. Please try again.',
          'error'
        );
      } finally {
        if (button) button.disabled = false;
      }
    });
  }

  // REGISTER FORM
  const register = document.querySelector('#register-form');

  if (register) {
    register.addEventListener('submit', async (event) => {
      event.preventDefault();

      const notice = register.querySelector('.notice');
      const passwordField = register.querySelector('[name="password"]');
      const confirmPasswordField =
        register.querySelector('[name="confirmPassword"]');
      const termsField = register.querySelector('[name="terms"]');
      const button = register.querySelector('[type="submit"]');

      if (!passwordField || !confirmPasswordField || !termsField) {
        Veloop.showNotice(
          notice,
          'Registration form is incomplete. Please refresh the page.',
          'error'
        );
        return;
      }

      const data = Object.fromEntries(new FormData(register).entries());
      const password = passwordField.value;

      if (password !== confirmPasswordField.value) {
        Veloop.showNotice(notice, 'Passwords do not match.', 'error');
        return;
      }

      if (!termsField.checked) {
        Veloop.showNotice(
          notice,
          'Please accept the Terms and Conditions.',
          'error'
        );
        return;
      }

      if (button) button.disabled = true;

      try {
        await Veloop.request('/api/auth/register', {
          method: 'POST',
          body: {
            firstName: data.firstName,
            lastName: data.lastName,
            username: data.username,
            email: data.email,
            mobile: data.mobile,
            password,
            terms: termsField.checked
          }
        });

        Veloop.toast('Account created. Please log in.');
        location.href = 'login.html';
      } catch (error) {
        Veloop.showNotice(
          notice,
          error.message || 'Registration failed. Please try again.',
          'error'
        );
      } finally {
        if (button) button.disabled = false;
      }
    });
  }

  // FORGOT PASSWORD FORM
  const forgot = document.querySelector('#forgot-form');

  if (forgot) {
    forgot.addEventListener('submit', async (event) => {
      event.preventDefault();

      const notice = forgot.querySelector('.notice');
      const emailField = forgot.querySelector('[name="email"]');

      if (!emailField) {
        Veloop.showNotice(
          notice,
          'Email field is missing from the form.',
          'error'
        );
        return;
      }

      try {
        const result = await Veloop.request('/api/auth/forgot-password', {
          method: 'POST',
          body: {
            email: emailField.value.trim()
          }
        });

        Veloop.showNotice(
          notice,
          result.message || 'Please check your email.',
          'success'
        );
      } catch (error) {
        Veloop.showNotice(
          notice,
          error.message || 'Unable to process your request.',
          'error'
        );
      }
    });
  }

  // SHOW / HIDE PASSWORD
  document.querySelectorAll('[data-toggle-password]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = document.getElementById(
        button.dataset.togglePassword
      );

      if (!input) {
        console.error('VELOOP: Password input was not found.');
        return;
      }

      const showing = input.type === 'password';
      input.type = showing ? 'text' : 'password';
      button.textContent = showing ? 'Hide' : 'Show';
    });
  });
});

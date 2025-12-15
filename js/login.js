const form = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const usernameError = document.getElementById('usernameError');
const passwordError = document.getElementById('passwordError');
const generalError = document.getElementById('generalError');

function showError(element, message, inputElement = null) {
  element.textContent = message;
  element.classList.add('show');
  if (inputElement) {
    inputElement.classList.add('input-error');
  }
}

function hideError(element, inputElement = null) {
  element.textContent = '';
  element.classList.remove('show');
  if (inputElement) {
    inputElement.classList.remove('input-error');
  }
}

usernameInput.addEventListener('input', () => {
  hideError(usernameError, usernameInput);
  hideError(generalError);
});

passwordInput.addEventListener('input', () => {
  hideError(passwordError, passwordInput);
  hideError(generalError);
});

if (!window.loginHandlerAttached) {
  window.loginHandlerAttached = true;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    hideError(usernameError, usernameInput);
    hideError(passwordError, passwordInput);
    hideError(generalError);

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    let hasError = false;

    if (!username) {
      showError(usernameError, 'Username obbligatorio', usernameInput);
      hasError = true;
    }

    if (!password) {
      showError(passwordError, 'Password obbligatoria', passwordInput);
      hasError = true;
    }

    if (hasError) return;

    try {
      const response = await fetch('http://localhost:8080/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));

        if (data.token) {
          localStorage.setItem('authToken', data.token);
        }
        if (data.username) localStorage.setItem('authUser', data.username);
        if (data.role) localStorage.setItem('userRole', data.role);

        const role = data.role || data.roles?.[0] || '';
        if (role.includes('ADMIN')) {
          window.location.href = 'gestioneProfiloAdmin.html';
        } else {
          window.location.href = 'catalog.html';
        }

      } else {
        const errorMessage = "Username o password non correti";

        showError(generalError, errorMessage);

        usernameInput.classList.add("input-error");
        passwordInput.classList.add("input-error");
      }

    } catch (error) {
      showError(
        generalError,
        "Username o password non corretti."
      );
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('authToken');
  const loginLink = document.getElementById('loginLink');
  if (token && loginLink) {
    loginLink.style.display = 'none';
  } else if (loginLink) {
    loginLink.style.display = 'block';
  }
});

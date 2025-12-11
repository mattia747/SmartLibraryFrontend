const form = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const usernameError = document.getElementById('usernameError');
const passwordError = document.getElementById('passwordError');
const generalError = document.getElementById('generalError');

// Funzione per mostrare errore
function showError(element, message, inputElement = null) {
  element.textContent = message;
  element.classList.add('show');
  if (inputElement) {
    inputElement.classList.add('input-error');
  }
}

// Funzione per nascondere errore
function hideError(element, inputElement = null) {
  element.textContent = '';
  element.classList.remove('show');
  if (inputElement) {
    inputElement.classList.remove('input-error');
  }
}

// Nascondi errori quando l'utente inizia a digitare
usernameInput.addEventListener('input', () => {
  hideError(usernameError, usernameInput);
  hideError(generalError);
});

passwordInput.addEventListener('input', () => {
  hideError(passwordError, passwordInput);
  hideError(generalError);
});

// Evita doppio listener se carichi anche altri script
if (!window.loginHandlerAttached) {
  window.loginHandlerAttached = true;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Nascondi tutti gli errori precedenti
    hideError(usernameError, usernameInput);
    hideError(passwordError, passwordInput);
    hideError(generalError);

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // Validazione client-side
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

    // Chiamata API
    try {
      const response = await fetch('http://localhost:8080/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      console.log('Status login:', response.status);

      if (response.ok) {
        const data = await response.json().catch(() => ({}));

        if (data.token) {
          localStorage.setItem('authToken', data.token);
        }
        if (data.username) localStorage.setItem('authUser', data.username);
        if (data.role) localStorage.setItem('userRole', data.role);

        // Redirect admin/utente
        const role = data.role || data.roles?.[0] || '';
        if (role.includes('ADMIN')) {
          window.location.href = 'gestioneProfiloAdmin.html';
        } else {
          window.location.href = 'catalog.html';
        }

      } else {
        // ================================
        // GESTIONE UNICA DEGLI ERRORI
        // ================================
        const errorMessage = "Email o password non corretta";

        showError(generalError, errorMessage);

        usernameInput.classList.add("input-error");
        passwordInput.classList.add("input-error");
      }

    } catch (error) {
      console.error("Errore di connessione:", error);

      showError(
        generalError,
        "Impossibile contattare il server. Assicurati che sia avviato."
      );
    }
  });
}

// Nascondi link Login se l'utente è loggato
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('authToken');
  const loginLink = document.getElementById('loginLink');
  if (token && loginLink) {
    loginLink.style.display = 'none';
  } else if (loginLink) {
    loginLink.style.display = 'block';
  }
});

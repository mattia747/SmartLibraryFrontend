document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.querySelector('.hero-form');
  if (!loginForm) return;

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const usernameInput = loginForm.querySelector('input[type="text"]');
    const passwordInput = loginForm.querySelector('input[type="password"]');

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      alert('Inserisci username e password');
      return;
    }

    const payload = {
      username: username,
      password: password
    };

    fetch('http://localhost:8080/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Credenziali non valide');
        }
        return response.json();
      })
      .then(data => {
        if (data.token) {
          localStorage.setItem('authToken', data.token);
        }
        if (data.username) {
          localStorage.setItem('authUser', data.username);
        }
        if (data.role) {
          localStorage.setItem('userRole', data.role);
        }
        const role = data.role || data.roles?.[0] || '';
        if (role === 'ROLE_ADMIN' || role === 'ADMIN' || role.includes('ADMIN')) {
          window.location.href = 'gestioneProfiloAdmin.html';
        } else {
          window.location.href = 'catalog.html';
        }
      })
      .catch(err => {
        alert('Login fallito: ' + err.message);
      });
  });
});

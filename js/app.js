document.addEventListener('DOMContentLoaded', () => {
  console.log('SmartLibrary frontend ready!');

  const loginForm = document.querySelector('.hero-form');
  if (!loginForm) return;

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Leggi i valori dal form
    const usernameInput = loginForm.querySelector('input[type="text"]');
    const passwordInput = loginForm.querySelector('input[type="password"]');

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      alert('Inserisci username e password');
      return;
    }

    // Costruisci il payload come usi in backend (adatta se necessario)
    const payload = {
      username: username,
      password: password
    };

    console.log('Login payload:', payload);

    // Chiamata al backend per autenticazione
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
        console.log('Login success:', data);
        // Salva il token JWT per le chiamate autenticate
        if (data.token) {
          localStorage.setItem('authToken', data.token);
        }
        // Salva username (può tornare utile)
        if (data.username) {
          localStorage.setItem('authUser', data.username);
        }
        if (data.role) {
          localStorage.setItem('userRole', data.role);
        }
        // Controlla se è admin e reindirizza
        const role = data.role || data.roles?.[0] || '';
        if (role === 'ROLE_ADMIN' || role === 'ADMIN' || role.includes('ADMIN')) {
          window.location.href = 'gestioneProfiloAdmin.html';
        } else {
          window.location.href = 'catalog.html';
        }
      })
      .catch(err => {
        console.error('Login error:', err);
        alert('Login fallito: ' + err.message);
      });
  });
});

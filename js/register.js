document.addEventListener('DOMContentLoaded', function() {
  const form = document.querySelector('.hero-form');
  if (!form) {
    return;
  }
  
  const nomeInput = document.getElementById('nome');
  const cognomeInput = document.getElementById('cognome');
  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  
  const nomeError = document.getElementById('nomeError');
  const cognomeError = document.getElementById('cognomeError');
  const usernameError = document.getElementById('usernameError');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  
  if (!nomeInput || !cognomeInput || !usernameInput || !emailInput || !passwordInput) {
    return;
  }
  if (!nomeError || !cognomeError || !usernameError || !emailError || !passwordError) {
    return;
  }

  function showError(errorElement, message, inputElement = null) {
    errorElement.textContent = message;
    errorElement.classList.add('show');
    if (inputElement) {
      inputElement.classList.add('input-error');
    }
  }

  function hideError(errorElement, inputElement = null) {
    errorElement.textContent = '';
    errorElement.classList.remove('show');
    if (inputElement) {
      inputElement.classList.remove('input-error');
    }
  }

  nomeInput.addEventListener('input', () => {
    hideError(nomeError, nomeInput);
  });

  cognomeInput.addEventListener('input', () => {
    hideError(cognomeError, cognomeInput);
  });

  usernameInput.addEventListener('input', () => {
    hideError(usernameError, usernameInput);
  });

  emailInput.addEventListener('input', () => {
    hideError(emailError, emailInput);
  });

  passwordInput.addEventListener('input', () => {
    hideError(passwordError, passwordInput);
  });

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    hideError(nomeError, nomeInput);
    hideError(cognomeError, cognomeInput);
    hideError(usernameError, usernameInput);
    hideError(emailError, emailInput);
    hideError(passwordError, passwordInput);

    const nome = nomeInput.value.trim();
    const cognome = cognomeInput.value.trim();
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const generi = form.querySelectorAll('input[type="checkbox"]:checked');

    let isValid = true;

    if (nome === '') {
      showError(nomeError, 'Nome obbligatorio', nomeInput);
      isValid = false;
    }

    if (cognome === '') {
      showError(cognomeError, 'Cognome obbligatorio', cognomeInput);
      isValid = false;
    }

    if (username === '') {
      showError(usernameError, 'Username obbligatorio', usernameInput);
      isValid = false;
    } else if (username.length < 3) {
      showError(usernameError, 'Lo username deve contenere almeno 3 caratteri', usernameInput);
      isValid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      showError(usernameError, 'Lo username può contenere solo lettere, numeri e underscore', usernameInput);
      isValid = false;
    }

    if (email === '') {
      showError(emailError, 'Email obbligatoria', emailInput);
      isValid = false;
    } else if (!isValidEmail(email)) {
      showError(emailError, 'Inserisci un\'email valida (es: esempio@email.com)', emailInput);
      isValid = false;
    }

    if (password === '') {
      showError(passwordError, 'Password obbligatoria', passwordInput);
      isValid = false;
    } else if (!isValidPassword(password)) {
      showError(passwordError, 'La password deve contenere almeno 8 caratteri, una maiuscola, una minuscola, un numero e un carattere speciale', passwordInput);
      isValid = false;
    }

    const generiBox = document.querySelector('.generi-box');
    if (generiBox && generi.length === 0) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message show';
      errorDiv.textContent = 'Seleziona almeno un genere';
      errorDiv.style.color = '#e74c3c';
      generiBox.style.borderColor = '#e74c3c';
      if (!generiBox.querySelector('.error-message')) {
        generiBox.appendChild(errorDiv);
      }
      isValid = false;
    }

    if (isValid) {
      const generiSelezionati = Array.from(generi).map(checkbox => checkbox.value);

      const userData = {
        nome: nome,
        cognome: cognome,
        username: username,
        email: email,
        password: password,
        generi: generiSelezionati
      };

      const backendPayload = {
        username: username,
        email: email,
        password: password
      };

      sendToBackend(backendPayload, showError, hideError, usernameError, emailError, usernameInput, emailInput);
    }
  });
});

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPassword(password) {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;

  return true;
}

function showSuccessMessage() {
  const form = document.querySelector('.hero-form');
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.textContent = '✓ Registrazione completata con successo!';
  successDiv.style.color = '#4CAF50';
  successDiv.style.fontSize = '1rem';
  successDiv.style.fontWeight = '600';
  successDiv.style.marginTop = '1rem';
  successDiv.style.padding = '0.8rem';
  successDiv.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
  successDiv.style.borderRadius = '8px';
  successDiv.style.textAlign = 'center';

  form.appendChild(successDiv);

  setTimeout(() => {
    successDiv.remove();
  }, 3000);
}

function sendToBackend(userData, showError, hideError, usernameError, emailError, usernameInput, emailInput) {
  fetch('http://localhost:8080/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData)
  })
  .then(async response => {
    let data = {};
    const contentType = response.headers.get('content-type');
    
    const text = await response.text();
    
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { message: text || 'Errore durante la registrazione' };
      }
    } else {
      data = { message: 'Errore durante la registrazione' };
    }
    
    if (response.ok) {
      showSuccessMessage();
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);
    } else {
      const errorMessage = data.message || data.error || data.details || data.title || 'Errore durante la registrazione';
      
      hideError(usernameError, usernameInput);
      hideError(emailError, emailInput);
      
      let usernameExists = false;
      let emailExists = false;
      
      if (data.username) {
        usernameExists = true;
        showError(usernameError, data.username, usernameInput);
      }
      if (data.email) {
        emailExists = true;
        showError(emailError, data.email, emailInput);
      }
      
      if (data.errors && Array.isArray(data.errors)) {
        data.errors.forEach(err => {
          const field = err.field || err.path || '';
          const msg = err.defaultMessage || err.message || '';
          if (field.toLowerCase().includes('username')) {
            usernameExists = true;
            showError(usernameError, msg || 'Username non valido', usernameInput);
          } else if (field.toLowerCase().includes('email')) {
            emailExists = true;
            showError(emailError, msg || 'Email non valida', emailInput);
          }
        });
      }
      
      if (!usernameExists && !emailExists) {
        const errorLower = errorMessage.toLowerCase();
        
        const isUsernameError = errorLower.includes('username') || errorLower.includes('utente') || errorLower.includes('nome utente');
        const isEmailError = errorLower.includes('email') || errorLower.includes('mail');
        const isDuplicateError = errorLower.includes('esiste') || errorLower.includes('già') || errorLower.includes('duplicat') || errorLower.includes('already') || errorLower.includes('taken') || errorLower.includes('exists');
        
        if (isUsernameError && isEmailError) {
          if (isDuplicateError) {
            showError(usernameError, 'Username già esistente', usernameInput);
            showError(emailError, 'Email già esistente', emailInput);
          } else {
            showError(usernameError, errorMessage, usernameInput);
            showError(emailError, errorMessage, emailInput);
          }
        } else if (isUsernameError) {
          if (isDuplicateError) {
            showError(usernameError, 'Username già esistente', usernameInput);
          } else {
            showError(usernameError, errorMessage, usernameInput);
          }
        } else if (isEmailError) {
          if (isDuplicateError) {
            showError(emailError, 'Email già esistente', emailInput);
          } else {
            showError(emailError, errorMessage, emailInput);
          }
        } else {
          if (errorMessage !== 'Errore durante la registrazione') {
            showError(usernameError, errorMessage, usernameInput);
            showError(emailError, errorMessage, emailInput);
          } else {
            showError(usernameError, 'Errore durante la registrazione. Controlla i dati inseriti.', usernameInput);
            showError(emailError, 'Errore durante la registrazione. Controlla i dati inseriti.', emailInput);
          }
        }
      }
    }
  })
  .catch((error) => {
    hideError(usernameError, usernameInput);
    hideError(emailError, emailInput);
    alert('Si è verificato un errore durante la registrazione. Riprova più tardi.');
  });
}

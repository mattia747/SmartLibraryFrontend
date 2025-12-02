// Validazione form di registrazione SmartLibrary

document.addEventListener('DOMContentLoaded', function() {
  const form = document.querySelector('.hero-form');

  // Aggiungi event listener al submit del form
  form.addEventListener('submit', function(e) {
    e.preventDefault();

    // Rimuovi tutti gli errori precedenti
    clearErrors();

    // Ottieni i valori dei campi
    const nome = form.querySelector('input[type="text"]:nth-of-type(1)').value.trim();
    const cognome = form.querySelector('input[type="text"]:nth-of-type(2)').value.trim();
    const eta = form.querySelector('input[type="number"]').value.trim();
    const email = form.querySelector('input[type="email"]').value.trim();
    const password = form.querySelector('input[type="password"]').value;
    const generi = form.querySelectorAll('input[type="checkbox"]:checked');

    let isValid = true;

    // Validazione Nome
    if (nome === '') {
      showError(form.querySelector('input[type="text"]:nth-of-type(1)'), 'Il nome è obbligatorio');
      isValid = false;
    }

    // Validazione Cognome
    if (cognome === '') {
      showError(form.querySelector('input[type="text"]:nth-of-type(2)'), 'Il cognome è obbligatorio');
      isValid = false;
    }

    // Validazione Età
    if (eta === '') {
      showError(form.querySelector('input[type="number"]'), 'L\'età è obbligatoria');
      isValid = false;
    }

    // Validazione Email
    if (email === '') {
      showError(form.querySelector('input[type="email"]'), 'L\'email è obbligatoria');
      isValid = false;
    } else if (!isValidEmail(email)) {
      showError(form.querySelector('input[type="email"]'), 'Inserisci un\'email valida (es: esempio@email.com)');
      isValid = false;
    }

    // Validazione Password
    if (password === '') {
      showError(form.querySelector('input[type="password"]'), 'La password è obbligatoria');
      isValid = false;
    } else if (!isValidPassword(password)) {
      showError(form.querySelector('input[type="password"]'),
        'La password deve contenere almeno 8 caratteri, una maiuscola, una minuscola, un numero e un carattere speciale');
      isValid = false;
    }

    // Validazione Generi
    if (generi.length === 0) {
      showError(document.querySelector('.generi-box'), 'Seleziona almeno un genere');
      isValid = false;
    }

    // Se tutto è valido, prepara i dati per l'invio
    if (isValid) {
      const generiSelezionati = Array.from(generi).map(checkbox => checkbox.value);

      const userData = {
        nome: nome,
        cognome: cognome,
        eta: parseInt(eta),
        email: email,
        password: password,
        generi: generiSelezionati
      };

      console.log('Dati da inviare al backend:', userData);

      // Mostra messaggio di successo
      showSuccessMessage();

      // TODO: Qui andrai ad inviare i dati al backend Spring Boot
      // sendToBackend(userData);
    }
  });
});

// Funzione per validare il formato email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Funzione per validare la password
function isValidPassword(password) {
  // Almeno 8 caratteri
  if (password.length < 8) return false;

  // Almeno una maiuscola
  if (!/[A-Z]/.test(password)) return false;

  // Almeno una minuscola
  if (!/[a-z]/.test(password)) return false;

  // Almeno un numero
  if (!/[0-9]/.test(password)) return false;

  // Almeno un carattere speciale
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;

  return true;
}

// Funzione per mostrare errori
function showError(element, message) {
  // Crea elemento errore
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  errorDiv.style.color = '#ff4444';
  errorDiv.style.fontSize = '0.85rem';
  errorDiv.style.marginTop = '0.3rem';
  errorDiv.style.fontWeight = '500';

  // Aggiungi bordo rosso all'input
  if (element.tagName === 'INPUT') {
    element.style.borderColor = '#ff4444';
    element.style.boxShadow = '0 0 0 3px rgba(255, 68, 68, 0.1)';

    // Inserisci l'errore dopo l'input
    element.parentElement.insertBefore(errorDiv, element.nextSibling);
  } else {
    // Per la generi-box
    element.style.borderColor = '#ff4444';
    element.appendChild(errorDiv);
  }
}

// Funzione per rimuovere tutti gli errori
function clearErrors() {
  // Rimuovi messaggi di errore
  const errors = document.querySelectorAll('.error-message');
  errors.forEach(error => error.remove());

  // Rimuovi bordi rossi dagli input
  const inputs = document.querySelectorAll('input');
  inputs.forEach(input => {
    input.style.borderColor = '';
    input.style.boxShadow = '';
  });

  // Rimuovi bordo rosso dalla generi-box
  const generiBox = document.querySelector('.generi-box');
  if (generiBox) {
    generiBox.style.borderColor = '';
  }

  // Rimuovi messaggio di successo se presente
  const successMsg = document.querySelector('.success-message');
  if (successMsg) {
    successMsg.remove();
  }
}

// Funzione per mostrare messaggio di successo
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

  // Rimuovi il messaggio dopo 3 secondi
  setTimeout(() => {
    successDiv.remove();
  }, 3000);
}

// Funzione da implementare per inviare dati al backend
function sendToBackend(userData) {
  // TODO: Implementa la chiamata API al tuo backend Spring Boot
  /*
  fetch('http://localhost:8080/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData)
  })
  .then(response => response.json())
  .then(data => {
    console.log('Success:', data);
    // Reindirizza al login o mostra messaggio di successo
    window.location.href = 'login.html';
  })
  .catch((error) => {
    console.error('Error:', error);
    // Mostra errore all'utente
  });
  */
}

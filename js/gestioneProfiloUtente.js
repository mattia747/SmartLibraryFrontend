const API_BASE_URL = 'http://localhost:8080';

function getToken() {
  return localStorage.getItem('authToken');
}

function authHeaders() {
  return {
    'Authorization': `Bearer ${getToken()}`,
    'Content-Type': 'application/json'
  };
}

function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

function hideLoading() {
  document.getElementById('profileLoading').style.display = 'none';
  document.getElementById('booksContainer').style.display = 'grid';
}

function showAlert(title, message, onConfirm = null) {
  const alertModal = document.getElementById('alertModal');
  const alertTitle = document.getElementById('alertModalTitle');
  const alertText = document.getElementById('alertModalText');
  const alertOk = document.getElementById('alertModalOk');
  
  if (!alertModal || !alertTitle || !alertText || !alertOk) return;
  
  alertTitle.textContent = title;
  alertText.textContent = message;
  
  const newOkBtn = alertOk.cloneNode(true);
  alertOk.parentNode.replaceChild(newOkBtn, alertOk);
  
  newOkBtn.addEventListener('click', () => {
    closeAlert();
    if (onConfirm) onConfirm();
  });
  
  alertModal.addEventListener('click', (e) => {
    if (e.target === alertModal) {
      closeAlert();
      if (onConfirm) onConfirm();
    }
  });
  
  alertModal.classList.add('show');
}

function closeAlert() {
  const alertModal = document.getElementById('alertModal');
  if (alertModal) {
    alertModal.classList.remove('show');
  }
}

function showMessage(message, type = 'success') {
  const bookModal = document.getElementById('bookModal');
  let messageContainer = document.getElementById('message-container');
  
  if (!bookModal) {
    messageContainer = document.getElementById('message-container');
    if (!messageContainer) return;
  } else {
    if (!messageContainer) {
      const modalContent = bookModal.querySelector('.modal-content');
      if (!modalContent) return;
      messageContainer = document.createElement('div');
      messageContainer.id = 'message-container';
      const modalClose = modalContent.querySelector('.modal-close');
      if (modalClose && modalClose.nextSibling) {
        modalContent.insertBefore(messageContainer, modalClose.nextSibling);
      } else {
        modalContent.insertBefore(messageContainer, modalContent.firstChild.nextSibling);
      }
    }
  }
  
  const className =
    type === 'success' ? 'success-message' : 'error-message-custom';
  messageContainer.innerHTML = `<div class="${className}">${message}</div>`;
  
  messageContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  
  setTimeout(() => {
    if (messageContainer) {
      messageContainer.innerHTML = '';
    }
  }, 5000);
}

async function loadProfile() {
  const token = getToken();

  if (!token) {
    hideLoading();
    showAlert(
      'Accesso richiesto',
      'Per accedere alla sezione profilo è necessario aver effettuato l\'accesso.',
      () => {
        window.location.href = 'login.html';
      }
    );
    return;
  }

  try {
    const headers = authHeaders();

    const res = await fetch(`${API_BASE_URL}/auth/me`, { headers });

    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('authToken');
      hideLoading();
      showAlert(
        'Accesso richiesto',
        'Per accedere alla sezione profilo è necessario aver effettuato l\'accesso.',
        () => {
          window.location.href = 'login.html';
        }
      );
      return;
    }
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Errore ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    displayProfile(data);
    hideLoading();
  } catch (err) {
    if (err.message.includes('403') || err.message.includes('401')) {
      hideLoading();
      showAlert(
        'Accesso richiesto',
        'Per accedere alla sezione profilo è necessario aver effettuato l\'accesso.',
        () => {
          window.location.href = 'login.html';
        }
      );
    } else {
      showError('Impossibile caricare il profilo: ' + err.message);
      hideLoading();
    }
  }
}

function displayProfile(data) {

  const profilePic = document.getElementById('profilePic');
  const profilePicText = document.getElementById('profilePicText');
  const profileName = document.getElementById('profileName');
  const profileEmail = document.getElementById('profileEmail');

  const username = data.username || "Utente";

  profileName.textContent = `Ciao ${username}`;

  profileEmail.textContent = data.email || "-";

  if (data.profileImageUrl) {
    profilePic.style.backgroundImage = `url(${data.profileImageUrl})`;
    profilePicText.style.display = "none";
  } else {
    profilePic.style.backgroundImage = "none";
    profilePicText.style.display = "flex";
    profilePicText.textContent = username.charAt(0).toUpperCase();
  }
}

async function loadReservations() {
  const token = getToken();
  if (!token) {
    return;
  }

  const container = document.getElementById('booksContainer');
  container.innerHTML = '<div class="loading">Caricamento prenotazioni...</div>';

  try {
    const res = await fetch(`${API_BASE_URL}/profile/reservations`, {
      headers: authHeaders()
    });

    if (res.status === 401 || res.status === 403) {
      container.innerHTML = '';
      return;
    }

    if (!res.ok) throw new Error(`Errore ${res.status}`);

    const reservations = await res.json();
    renderReservations(reservations);
  } catch (err) {
    if (err.message.includes('403') || err.message.includes('401')) {
      container.innerHTML = '';
    } else {
      container.innerHTML =
        '<div class="error-message">Errore nel caricare le prenotazioni.</div>';
    }
  } finally {
    hideLoading();
  }
}

async function renderReservations(reservations) {
  const container = document.getElementById('booksContainer');

  if (!reservations.length) {
    container.innerHTML = '<p class="loading">Nessuna prenotazione ancora.</p>';
    return;
  }

  container.innerHTML = '';

  for (const r of reservations) {
    try {
      let bookData = null;

      const bookRes = await fetch(`${API_BASE_URL}/api/books/${r.bookId}`, {
        headers: authHeaders()
      });
      if (bookRes.ok) {
        bookData = await bookRes.json();
      }

      const reservationDate = new Date(r.reservationDate);
      const returnDate = new Date(reservationDate);
      returnDate.setMonth(returnDate.getMonth() + 1);

      const returnDateStr = returnDate.toLocaleDateString('it-IT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const reservationDateStr = reservationDate.toLocaleDateString('it-IT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const coverUrl = bookData?.coverImageUrl || 'img/logo.png';

      let statusText = '';
      let statusClass = '';
      
      const isActive = r.active === true || r.active === 'true' || r.active === 1 || r.active === '1';
      
      const isExplicitlyExpired = r.expired === true || r.expired === 'true';
      
      if (isExplicitlyExpired) {
        statusText = 'Stato: Scaduto';
        statusClass = 'status-expired';
      } else if (isActive) {
        statusText = 'Stato: Attiva';
        statusClass = 'status-active';
      } else {
        statusText = 'Stato: Non attiva';
        statusClass = 'status-inactive';
      }

      const card = document.createElement('div');
      card.className = 'book-card';
      if (statusClass === 'status-expired') {
        card.classList.add('expired-reservation');
      }
      
      card.innerHTML = `
        <img src="${coverUrl}" alt="Copertina ${r.bookTitle}" onerror="this.src='img/logo.png'">
        <h3>${r.bookTitle}</h3>
        <p class="reservation-date">Prenotato il: ${reservationDateStr}</p>
        <p class="return-date"><strong>Data restituzione: ${returnDateStr}</strong></p>
        <p class="reservation-status ${statusClass}">
          ${statusText}
        </p>
      `;

      card.addEventListener('click', async () => {
        let data = bookData;
        if (!data && r.bookId) {
          try {
            const bookRes2 = await fetch(`${API_BASE_URL}/api/books/${r.bookId}`, {
              headers: authHeaders()
            });
            if (bookRes2.ok) data = await bookRes2.json();
          } catch (err) {
          }
        }
        openBookModal(r, data);
      });

      container.appendChild(card);
    } catch (err) {
      const reservationDate = new Date(r.reservationDate);
      const returnDate = new Date(reservationDate);
      returnDate.setMonth(returnDate.getMonth() + 1);
      const returnDateStr = returnDate.toLocaleDateString('it-IT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      let statusText = '';
      let statusClass = '';
      
      const isActive = r.active === true || r.active === 'true' || r.active === 1 || r.active === '1';
      const isExplicitlyExpired = r.expired === true || r.expired === 'true';
      
      if (isExplicitlyExpired) {
        statusText = 'Stato: Scaduto';
        statusClass = 'status-expired';
      } else if (isActive) {
        statusText = 'Stato: Attiva';
        statusClass = 'status-active';
      } else {
        statusText = 'Stato: Non attiva';
        statusClass = 'status-inactive';
      }

      const card = document.createElement('div');
      card.className = 'book-card';
      if (statusClass === 'status-expired') {
        card.classList.add('expired-reservation');
      }
      card.innerHTML = `
        <img src="img/logo.png" alt="Copertina ${r.bookTitle}">
        <h3>${r.bookTitle}</h3>
        <p class="reservation-date">Prenotato il: ${r.reservationDate || '-'}</p>
        <p class="return-date"><strong>Data restituzione: ${returnDateStr}</strong></p>
        <p class="reservation-status ${statusClass}">${statusText}</p>
      `;

      card.addEventListener('click', async () => {
        let data = null;
        if (r.bookId) {
          try {
            const bookRes = await fetch(`${API_BASE_URL}/api/books/${r.bookId}`, {
              headers: authHeaders()
            });
            if (bookRes.ok) data = await bookRes.json();
          } catch (err2) {
          }
        }
        openBookModal(r, data);
      });

      container.appendChild(card);
    }
  }
}

const profilePic = document.getElementById('profilePic');
const profilePicInput = document.getElementById('profilePicInput');
const profilePicText = document.getElementById('profilePicText');

if (profilePic && profilePicInput) {
  profilePic.addEventListener('click', () => profilePicInput.click());

  profilePicInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Image = event.target.result;

        profilePicText.style.display = 'none';
        profilePic.style.background = 'none';
        profilePic.innerHTML =
          `<img src="${base64Image}" class="profile-pic-uploaded" alt="Foto profilo">`;

        const token = getToken();
        if (!token) {
          return;
        }

        try {
          const response = await fetch(`${API_BASE_URL}/profile/image`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ profileImageUrl: base64Image })
          });

          if (response.ok) {
          } else {
            const errorText = await response.text();
            alert('Errore nel salvare l\'immagine. Riprova più tardi.');
          }
        } catch (error) {
          alert('Errore di connessione. Riprova più tardi.');
        }
      };
      reader.readAsDataURL(file);
    }
  });
}

function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
  window.location.href = 'login.html';
}

function openDeleteAccountModal() {
  const modal = document.getElementById('deleteAccountModal');
  if (modal) modal.classList.add('show');
}

function closeDeleteAccountModal() {
  const modal = document.getElementById('deleteAccountModal');
  if (modal) modal.classList.remove('show');
}

async function performDeleteAccount() {
  const token = getToken();
  if (!token) {
    alert('Non sei autenticato.');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/profile/delete`, {
      method: 'DELETE',
      headers: authHeaders()
    });

    if (response.ok) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      alert('Account eliminato con successo.');
      window.location.href = 'login.html';
    } else {
      const errorText = await response.text();

      if (response.status === 403) {
        alert(
          'Accesso negato. Verifica che l\'endpoint del backend sia corretto.\n\n' +
          'Endpoint provato: DELETE /profile/delete\n' +
          'Se il tuo backend usa un endpoint diverso, modifica il codice in profiloUtente.js'
        );
      } else {
        alert('Errore nell\'eliminazione dell\'account (Status: ' +
          response.status + '). Riprova più tardi.');
      }
    }
  } catch (error) {
    alert('Errore di connessione. Riprova più tardi.');
  } finally {
    closeDeleteAccountModal();
  }
}

let currentBookId = null;
let selectedRating = 0;
let isLoadingReviews = false;
let reviewsLoadFailed = false;

const bookModal = document.getElementById('bookModal');
const modalClose = document.getElementById('modalClose');
const reviewsToggle = document.getElementById('reviews-toggle');
const reviewsContent = document.getElementById('reviews-content');
const reviewsList = document.getElementById('reviews-list');
const reviewsCount = document.getElementById('reviews-count');
const starInputStars = document.querySelectorAll('.star-input-star');
const starRatingValue = document.getElementById('star-rating-value');
const reviewCommentInput = document.getElementById('review-comment-input');
const btnSubmitReview = document.getElementById('btn-submit-review');

function openBookModal(reservation, bookData) {
  currentBookId = reservation.bookId;
  selectedRating = 0;

  const messageContainer = document.getElementById('message-container');
  if (messageContainer) {
    messageContainer.innerHTML = '';
  }

  document.getElementById('modalTitle').textContent =
    reservation.bookTitle || 'Titolo non disponibile';
  document.getElementById('modalAuthor').textContent = bookData?.author || '-';
  document.getElementById('modalYear').textContent = bookData?.publicationYear || '-';
  document.getElementById('modalGenre').textContent = bookData?.genre || '-';
  const isActive = reservation.active === true || reservation.active === 'true' || reservation.active === 1 || reservation.active === '1';
  const isExplicitlyExpired = reservation.expired === true || reservation.expired === 'true';
  
  let modalStatusText = '';
  if (isExplicitlyExpired) {
    modalStatusText = 'Scaduto';
  } else if (isActive) {
    modalStatusText = 'Prenotato';
  } else {
    modalStatusText = 'Non attivo';
  }
  document.getElementById('modalStatus').textContent = modalStatusText;

  const coverImg = document.getElementById('modalBookCover');
  if (coverImg && bookData?.coverImageUrl) {
    coverImg.src = bookData.coverImageUrl;
  } else if (coverImg) {
    coverImg.src = 'img/logo.png';
  }

  if (reviewsContent) reviewsContent.style.display = 'none';
  if (reviewsToggle) reviewsToggle.classList.remove('expanded');
  if (reviewsList) reviewsList.innerHTML = '<div class="loading">Caricamento recensioni...</div>';
  if (reviewsCount) reviewsCount.textContent = '(0)';
  if (reviewCommentInput) reviewCommentInput.value = '';
  if (starRatingValue) starRatingValue.textContent = '0 stelle';

  starInputStars.forEach(star => star.classList.remove('active'));

  reviewsLoadFailed = false;
  isLoadingReviews = false;

  if (currentBookId) {
    loadReviews(currentBookId);
  }

  if (bookModal) bookModal.classList.add('show');
}

function closeBookModal() {
  if (bookModal) bookModal.classList.remove('show');
  currentBookId = null;
  selectedRating = 0;
}

async function loadReviews(bookId) {
  if (isLoadingReviews) return;

  if (reviewsLoadFailed) {
    if (reviewsList) {
      reviewsList.innerHTML =
        '<div class="no-reviews">Recensioni non disponibili.</div>';
    }
    if (reviewsCount) reviewsCount.textContent = '(0)';
    return;
  }

  isLoadingReviews = true;

  try {
    const res = await fetch(`${API_BASE_URL}/api/books/${bookId}/reviews`, {
      headers: authHeaders()
    });

    if (!res.ok) {
      if (res.status === 404) {
        renderReviews([]);
        isLoadingReviews = false;
        return;
      }
      if (res.status === 403) {
        reviewsLoadFailed = true;
        if (reviewsList) {
          reviewsList.innerHTML =
            '<div class="no-reviews">Le recensioni non sono disponibili. Verifica i permessi.</div>';
        }
        if (reviewsCount) reviewsCount.textContent = '(0)';
        isLoadingReviews = false;
        return;
      }
      throw new Error(`Errore ${res.status}`);
    }

    const reviews = await res.json();
    renderReviews(reviews);
    reviewsLoadFailed = false;
  } catch (err) {
    reviewsLoadFailed = true;
    if (reviewsList) {
      reviewsList.innerHTML =
        '<div class="no-reviews">Errore nel caricare le recensioni.</div>';
    }
    if (reviewsCount) reviewsCount.textContent = '(0)';
  } finally {
    isLoadingReviews = false;
  }
}

function renderReviews(reviews) {
  if (!reviewsList || !reviewsCount) return;

  if (!reviews || reviews.length === 0) {
    reviewsList.innerHTML = '<div class="no-reviews">Nessuna recensione ancora.</div>';
    reviewsCount.textContent = '(0)';
    return;
  }

  reviewsCount.textContent = `(${reviews.length})`;

  reviewsList.innerHTML = reviews.map(review => {
    const stars = Array.from({ length: 5 }, (_, i) => {
      const filled = i < review.rating;
      return `<span class="star ${filled ? '' : 'empty'}">★</span>`;
    }).join('');

    const date = review.reviewDate
      ? new Date(review.reviewDate).toLocaleDateString('it-IT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      : '';

    return `
      <div class="review-item">
        <div class="review-header">
          <span class="review-user">${review.username || 'Utente'}</span>
          <div class="review-rating">${stars}</div>
        </div>
        ${review.comment ? `<div class="review-comment">${review.comment}</div>` : ''}
        ${date ? `<div class="review-date">${date}</div>` : ''}
      </div>
    `;
  }).join('');
}

if (reviewsToggle) {
  reviewsToggle.addEventListener('click', () => {
    if (!reviewsContent) return;
    const isExpanded = reviewsToggle.classList.contains('expanded');
    if (isExpanded) {
      reviewsContent.style.display = 'none';
      reviewsToggle.classList.remove('expanded');
    } else {
      reviewsContent.style.display = 'block';
      reviewsToggle.classList.add('expanded');
    }
  });
}

starInputStars.forEach((star, index) => {
  star.addEventListener('click', () => {
    selectedRating = index + 1;
    starInputStars.forEach((s, i) => {
      if (i < selectedRating) s.classList.add('active');
      else s.classList.remove('active');
    });
    if (starRatingValue) {
      starRatingValue.textContent =
        selectedRating === 1 ? '1 stella' : `${selectedRating} stelle`;
    }
  });
});

if (btnSubmitReview) {
  btnSubmitReview.addEventListener('click', async () => {
    if (!currentBookId) {
      showMessage('Errore: ID libro non disponibile.', 'error');
      return;
    }

    if (selectedRating === 0) {
      showMessage('Seleziona una valutazione da 1 a 5 stelle.', 'error');
      return;
    }

    const comment = reviewCommentInput ? reviewCommentInput.value.trim() : '';

    try {
      const res = await fetch(`${API_BASE_URL}/api/books/${currentBookId}/reviews`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          rating: selectedRating,
          comment: comment || null
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        if (res.status === 403) {
          showMessage('Non hai i permessi per lasciare una recensione. Verifica di aver prenotato questo libro.', 'error');
          return;
        }
        const errorLower = errorText.toLowerCase();
        if (errorLower.includes('already') || errorLower.includes('già') || errorLower.includes('duplicate') || errorLower.includes('already submitted')) {
          showMessage('Hai già inviato una recensione per questo libro.', 'error');
          return;
        }
        throw new Error(errorText || `Errore ${res.status}`);
      }

      showMessage('Recensione inviata con successo!', 'success');

      selectedRating = 0;
      if (reviewCommentInput) reviewCommentInput.value = '';
      if (starRatingValue) starRatingValue.textContent = '0 stelle';
      starInputStars.forEach(star => star.classList.remove('active'));

      reviewsLoadFailed = false;
      await loadReviews(currentBookId);
    } catch (err) {
      showMessage('Errore nell\'invio della recensione: ' + err.message, 'error');
    }
  });
}

if (modalClose) {
  modalClose.addEventListener('click', closeBookModal);
}
if (bookModal) {
  bookModal.addEventListener('click', (e) => {
    if (e.target === bookModal) closeBookModal();
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const btnLogout = document.getElementById('btnLogout');
  const btnDeleteAccount = document.getElementById('btnDeleteAccount');
  const cancelDeleteAccount = document.getElementById('cancelDeleteAccount');
  const confirmDeleteAccountBtn = document.getElementById('confirmDeleteAccount');
  const deleteAccountModal = document.getElementById('deleteAccountModal');

  if (btnLogout) {
    btnLogout.addEventListener('click', logout);
  }

  if (btnDeleteAccount) {
    btnDeleteAccount.addEventListener('click', openDeleteAccountModal);
  }

  if (cancelDeleteAccount) {
    cancelDeleteAccount.addEventListener('click', closeDeleteAccountModal);
  }

  if (deleteAccountModal) {
    deleteAccountModal.addEventListener('click', (e) => {
      if (e.target === deleteAccountModal) {
        closeDeleteAccountModal();
      }
    });
  }

  if (confirmDeleteAccountBtn) {
    confirmDeleteAccountBtn.addEventListener('click', performDeleteAccount);
  }

  await loadProfile();
  await loadReservations();
});

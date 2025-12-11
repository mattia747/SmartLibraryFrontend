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

// =========================
// Profilo utente
// =========================

async function loadProfile() {
  const token = getToken();
  console.log('Token recuperato:', token ? 'Presente' : 'Mancante');

  if (!token) {
    showError('Non sei autenticato. Effettua il login per accedere al profilo.');
    hideLoading();
    setTimeout(() => window.location.href = 'login.html', 1500);
    return;
  }

  try {
    const headers = authHeaders();
    console.log('Headers inviati:', headers);
    console.log('Chiamata a:', `${API_BASE_URL}/auth/me`);

    const res = await fetch(`${API_BASE_URL}/auth/me`, { headers });

    console.log('Risposta status:', res.status);

    if (res.status === 401) {
      localStorage.removeItem('authToken');
      showError('Sessione scaduta. Effettua nuovamente il login.');
      setTimeout(() => window.location.href = 'login.html', 2000);
      hideLoading();
      return;
    }
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Errore risposta:', errorText);
      throw new Error(`Errore ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    console.log('Dati profilo ricevuti:', data);
    displayProfile(data);
    hideLoading();
  } catch (err) {
    console.error('Errore profilo:', err);
    showError('Impossibile caricare il profilo: ' + err.message);
    hideLoading();
  }
}

function displayProfile(data) {

  const profilePic = document.getElementById('profilePic');
  const profilePicText = document.getElementById('profilePicText');
  const profileName = document.getElementById('profileName');
  const profileEmail = document.getElementById('profileEmail');

  // Nome utente
  const username = data.username || "Utente";

  // Metto "Ciao NomeUtente"
  profileName.textContent = `Ciao ${username}`;

  // Email
  profileEmail.textContent = data.email || "-";

  // Foto profilo o iniziale
  if (data.profileImageUrl) {
    profilePic.style.backgroundImage = `url(${data.profileImageUrl})`;
    profilePicText.style.display = "none";
  } else {
    profilePic.style.backgroundImage = "none";
    profilePicText.style.display = "flex";
    profilePicText.textContent = username.charAt(0).toUpperCase();
  }
}


// =========================
// Prenotazioni utente
// =========================

async function loadReservations() {
  const token = getToken();
  if (!token) return;

  const container = document.getElementById('booksContainer');
  container.innerHTML = '<div class="loading">Caricamento prenotazioni...</div>';

  try {
    const res = await fetch(`${API_BASE_URL}/profile/reservations`, {
      headers: authHeaders()
    });

    if (!res.ok) throw new Error(`Errore ${res.status}`);

    const reservations = await res.json();
    renderReservations(reservations);
  } catch (err) {
    console.error('Errore prenotazioni:', err);
    container.innerHTML =
      '<div class="error-message">Errore nel caricare le prenotazioni.</div>';
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

      // Dettagli libro (per copertina + info)
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

      const card = document.createElement('div');
      card.className = 'book-card';
      card.innerHTML = `
        <img src="${coverUrl}" alt="Copertina ${r.bookTitle}" onerror="this.src='img/logo.png'">
        <h3>${r.bookTitle}</h3>
        <p class="reservation-date">Prenotato il: ${reservationDateStr}</p>
        <p class="return-date"><strong>Data restituzione: ${returnDateStr}</strong></p>
        <p class="reservation-status">
          ${r.active ? 'Stato: Attiva' : 'Stato: Non attiva'}${r.collected ? ' · Ritirata' : ''}
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
            console.error('Errore nel caricare dettagli libro:', err);
          }
        }
        openBookModal(r, data);
      });

      container.appendChild(card);
    } catch (err) {
      console.error('Errore nel caricare dettagli libro:', err);

      const reservationDate = new Date(r.reservationDate);
      const returnDate = new Date(reservationDate);
      returnDate.setMonth(returnDate.getMonth() + 1);
      const returnDateStr = returnDate.toLocaleDateString('it-IT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const card = document.createElement('div');
      card.className = 'book-card';
      card.innerHTML = `
        <img src="img/logo.png" alt="Copertina ${r.bookTitle}">
        <h3>${r.bookTitle}</h3>
        <p class="reservation-date">Prenotato il: ${r.reservationDate || '-'}</p>
        <p class="return-date"><strong>Data restituzione: ${returnDateStr}</strong></p>
        <p class="reservation-status">${r.active ? 'Stato: Attiva' : 'Stato: Non attiva'}</p>
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
            console.error('Errore nel caricare dettagli libro:', err2);
          }
        }
        openBookModal(r, data);
      });

      container.appendChild(card);
    }
  }
}

// =========================
// Immagine profilo
// =========================

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
          console.error('Token non disponibile');
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
            console.log('Immagine profilo salvata!');
          } else {
            const errorText = await response.text();
            console.error('Errore nel salvataggio immagine:', errorText);
            alert('Errore nel salvare l\'immagine. Riprova più tardi.');
          }
        } catch (error) {
          console.error('Errore:', error);
          alert('Errore di connessione. Riprova più tardi.');
        }
      };
      reader.readAsDataURL(file);
    }
  });
}

// =========================
// Logout + Eliminazione Account
// =========================

function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
  window.location.href = 'login.html';
}

// apre il popup personalizzato
function openDeleteAccountModal() {
  const modal = document.getElementById('deleteAccountModal');
  if (modal) modal.classList.add('show');
}

function closeDeleteAccountModal() {
  const modal = document.getElementById('deleteAccountModal');
  if (modal) modal.classList.remove('show');
}

// chiamata reale al backend per eliminare l'account
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

    console.log('Tentativo eliminazione account - Status:', response.status);
    console.log('Endpoint usato:', `${API_BASE_URL}/profile/delete`);

    if (response.ok) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      alert('Account eliminato con successo.');
      window.location.href = 'login.html';
    } else {
      const errorText = await response.text();
      console.error('Errore eliminazione account - Status:', response.status);
      console.error('Errore eliminazione account - Response:', errorText);

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
    console.error('Errore:', error);
    alert('Errore di connessione. Riprova più tardi.');
  } finally {
    closeDeleteAccountModal();
  }
}

// =========================
// Modal libro + Recensioni
// =========================

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

  document.getElementById('modalTitle').textContent =
    reservation.bookTitle || 'Titolo non disponibile';
  document.getElementById('modalAuthor').textContent = bookData?.author || '-';
  document.getElementById('modalYear').textContent = bookData?.publicationYear || '-';
  document.getElementById('modalGenre').textContent = bookData?.genre || '-';
  document.getElementById('modalStatus').textContent =
    reservation.active ? 'Prenotato' : 'Non attivo';

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
        console.warn('Accesso negato alle recensioni (403).');
        isLoadingReviews = false;
        return;
      }
      throw new Error(`Errore ${res.status}`);
    }

    const reviews = await res.json();
    renderReviews(reviews);
    reviewsLoadFailed = false;
  } catch (err) {
    console.error('Errore nel caricamento recensioni:', err);
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

// Toggle recensioni
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

// Gestione stelle
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

// Invia recensione
if (btnSubmitReview) {
  btnSubmitReview.addEventListener('click', async () => {
    if (!currentBookId) {
      alert('Errore: ID libro non disponibile.');
      return;
    }

    if (selectedRating === 0) {
      alert('Seleziona una valutazione da 1 a 5 stelle.');
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
          alert('Non hai i permessi per lasciare una recensione. Verifica di aver prenotato questo libro.');
          return;
        }
        throw new Error(errorText || `Errore ${res.status}`);
      }

      alert('Recensione inviata con successo!');

      selectedRating = 0;
      if (reviewCommentInput) reviewCommentInput.value = '';
      if (starRatingValue) starRatingValue.textContent = '0 stelle';
      starInputStars.forEach(star => star.classList.remove('active'));

      reviewsLoadFailed = false;
      await loadReviews(currentBookId);
    } catch (err) {
      console.error('Errore nell\'invio recensione:', err);
      alert('Errore nell\'invio della recensione: ' + err.message);
    }
  });
}

// Chiudi modal libro
if (modalClose) {
  modalClose.addEventListener('click', closeBookModal);
}
if (bookModal) {
  bookModal.addEventListener('click', (e) => {
    if (e.target === bookModal) closeBookModal();
  });
}

// =========================
// Eventi DOMContentLoaded
// =========================

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

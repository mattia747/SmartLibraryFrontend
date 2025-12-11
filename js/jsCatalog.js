// Catalogo collegato al backend Spring Boot
const API_BASE_URL = 'http://localhost:8080';

// Stato
let books = [];
let selectedBook = null;
// indice del libro attualmente aperto nel modal
let currentIndex = null;

// DOM
const container = document.getElementById('books-container');
const paginationContainer = document.getElementById('pagination'); // non usato ora, ma lasciato per layout
const searchForm = document.querySelector('.search-bar');
const searchInput = document.getElementById('searchInput');
const genreSelect = document.getElementById('genreFilter');

// Modal
const modalOverlay = document.getElementById('book-modal');
const modalCover = document.getElementById('modal-cover');
const modalTitle = document.getElementById('modal-title');
const modalAuthors = document.getElementById('modal-authors');
const modalCategories = document.getElementById('modal-categories');
const modalPublished = document.getElementById('modal-published');
const modalDescription = document.getElementById('modal-description');
const modalBookButton = document.getElementById('modal-book-button');
const modalCloseBtn = document.querySelector('.book-modal-close');
const modalAvailability = document.getElementById('modal-availability');
const reviewsToggle = document.getElementById('reviews-toggle');
const reviewsContent = document.getElementById('reviews-content');
const reviewsList = document.getElementById('reviews-list');
const reviewsCount = document.getElementById('reviews-count');
const modalPrev = document.getElementById('modal-prev');
const modalNext = document.getElementById('modal-next');


// ===============================
// Gestione link Profilo in base al ruolo
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  const profileLink = document.getElementById('profileLink');
  if (!profileLink) return;

  const rawRole = (localStorage.getItem('userRole') || '').toUpperCase();

  // DEBUG: vedi il ruolo che legge
  console.log("Ruolo utente:", rawRole);

  if (rawRole.includes('ADMIN')) {
    // Admin → pagina admin
    profileLink.href = 'gestioneProfiloAdmin.html';
  } else {
    // Utente → pagina utente
    profileLink.href = 'gestioneProfiloUtente.html';
  }
});


function getToken() {
  return localStorage.getItem('authToken');
}

function authHeaders() {
  const token = getToken();
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

// ===============================
// Caricamento libri dal backend
// ===============================
async function loadBooks(params = {}) {
  const { title = '', genre = '' } = params;
  const qs = new URLSearchParams();
  if (title) qs.append('title', title);
  if (genre) qs.append('genre', genre);

  container.innerHTML = '<p>Caricamento dei libri in corso...</p>';

  try {
    const res = await fetch(`${API_BASE_URL}/api/books${qs.toString() ? `?${qs}` : ''}`);
    if (!res.ok) throw new Error(`Errore ${res.status}`);
    books = await res.json();
    renderBooks();
  } catch (err) {
    console.error('Errore nel caricamento libri:', err);
    container.innerHTML = '<p>Errore nel caricamento del catalogo.</p>';
  }
}

function renderBooks() {
  container.innerHTML = '';
  if (!books.length) {
    container.innerHTML = '<p>Nessun libro trovato.</p>';
    return;
  }

  books.forEach((book, index) => {
    const card = document.createElement('div');
    card.className = 'book-card';
    card.dataset.id = book.id;

    const cover = book.coverImageUrl || 'img/logo.png';
    const authors = book.author || 'Autore sconosciuto';
    const year = book.publicationYear ? ` · ${book.publicationYear}` : '';
    const copies = book.copiesAvailable ?? 'N/D';

    card.innerHTML = `
      <img src="${cover}" alt="Copertina libro">
      <h3>${book.title}</h3>
      <p>${authors}${year}</p>
      <p class="author">Genere: ${book.genre || 'N/D'}</p>
      <p class="author">Copie disponibili: ${copies}</p>
    `;

    // 👉 tutta la card apre il modal in base all'indice
    card.addEventListener('click', () => {
      openModal(index);
    });

    container.appendChild(card);
  });
}

// ===============================
// Modal
// ===============================

function openModal(index) {
  if (index < 0 || index >= books.length) return;

  currentIndex = index;
  const book = books[index];
  selectedBook = book;

  if (modalTitle) modalTitle.textContent = book.title || 'Titolo non disponibile';
  if (modalAuthors) modalAuthors.textContent = book.author || 'Autore sconosciuto';
  if (modalCategories)
    modalCategories.textContent = book.genre ? `Genere: ${book.genre}` : 'Genere non disponibile';
  if (modalPublished)
    modalPublished.textContent = book.publicationYear
      ? `Pubblicato: ${book.publicationYear}`
      : 'Anno non disponibile';
  if (modalDescription)
    modalDescription.textContent = book.description || 'Nessuna descrizione disponibile.';
  if (modalCover) {
    const cover = book.coverImageUrl || 'img/logo.png';
    modalCover.src = cover;
    modalCover.style.display = 'block';
  }

  const copies = book.copiesAvailable ?? 0;
  const available = copies > 0;
  if (modalAvailability) {
    modalAvailability.textContent = available
      ? `Disponibile (${copies} copie)`
      : 'Non disponibile';
    modalAvailability.classList.toggle('available', available);
    modalAvailability.classList.toggle('unavailable', !available);
  }
  if (modalBookButton) {
    modalBookButton.disabled = !available;
  }

  // abilita / disabilita i bottoni Prev/Next
  if (modalPrev) {
    modalPrev.disabled = currentIndex <= 0;
  }
  if (modalNext) {
    modalNext.disabled = currentIndex >= books.length - 1;
  }

  // Reset recensioni
  if (reviewsContent) reviewsContent.style.display = 'none';
  if (reviewsToggle) reviewsToggle.classList.remove('expanded');
  if (reviewsList) reviewsList.innerHTML = '<div class="loading">Caricamento recensioni...</div>';
  if (reviewsCount) reviewsCount.textContent = '(0)';

  // Carica recensioni
  if (book.id) {
    loadReviews(book.id);
  }

  if (modalOverlay) modalOverlay.classList.add('show');
}

function closeModal() {
  if (modalOverlay) modalOverlay.classList.remove('show');
  selectedBook = null;
  currentIndex = null;
}

if (modalCloseBtn) {
  modalCloseBtn.addEventListener('click', closeModal);
}
if (modalOverlay) {
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
}

// tasto prenota dal modal
if (modalBookButton) {
  modalBookButton.addEventListener('click', async () => {
    if (!selectedBook) return;
    await reserveBook(selectedBook.id);
  });
}

// bottoni avanti / indietro nel modal
if (modalPrev) {
  modalPrev.addEventListener('click', () => {
    if (currentIndex === null) return;
    if (currentIndex > 0) {
      openModal(currentIndex - 1);
    }
  });
}
if (modalNext) {
  modalNext.addEventListener('click', () => {
    if (currentIndex === null) return;
    if (currentIndex < books.length - 1) {
      openModal(currentIndex + 1);
    }
  });
}

// tastiera: Esc, freccia sinistra/destra
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  } else if (e.key === 'ArrowRight') {
    if (
      modalOverlay &&
      modalOverlay.classList.contains('show') &&
      currentIndex !== null &&
      currentIndex < books.length - 1
    ) {
      openModal(currentIndex + 1);
    }
  } else if (e.key === 'ArrowLeft') {
    if (
      modalOverlay &&
      modalOverlay.classList.contains('show') &&
      currentIndex !== null &&
      currentIndex > 0
    ) {
      openModal(currentIndex - 1);
    }
  }
});

// ===============================
// Prenotazione
// ===============================
async function reserveBook(bookId) {
  if (!getToken()) {
    alert('Devi effettuare il login per prenotare.');
    window.location.href = 'login.html';
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/reservations/${bookId}`, {
      method: 'POST',
      headers: authHeaders()
    });

    if (res.ok) {
      alert('Prenotazione confermata! Riceverai una email con i dettagli.');
      closeModal();
      await loadBooks({
        title: searchInput?.value?.trim() || '',
        genre: genreSelect?.value || ''
      });
    } else {
      const errorText = await res.text();
      alert(`Errore: ${errorText || 'Prenotazione non riuscita'}`);
    }
  } catch (err) {
    console.error('Errore prenotazione:', err);
    alert('Errore durante la prenotazione. Riprova.');
  }
}

// ===============================
// Recensioni
// ===============================
async function loadReviews(bookId) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/books/${bookId}/reviews`, {
      headers: authHeaders()
    });

    if (!res.ok) {
      if (res.status === 404) {
        // Nessuna recensione trovata
        renderReviews([]);
        return;
      }
      throw new Error(`Errore ${res.status}`);
    }

    const reviews = await res.json();
    renderReviews(reviews);
  } catch (err) {
    console.error('Errore nel caricamento recensioni:', err);
    if (reviewsList) {
      reviewsList.innerHTML = '<div class="no-reviews">Errore nel caricare le recensioni.</div>';
    }
    if (reviewsCount) reviewsCount.textContent = '(0)';
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

  reviewsList.innerHTML = reviews
    .map((review) => {
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
    })
    .join('');
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

// ===============================
// Eventi form ricerca
// ===============================
if (searchForm && searchInput) {
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    loadBooks({ title: searchInput.value.trim(), genre: genreSelect?.value || '' });
  });
}
if (genreSelect) {
  genreSelect.addEventListener('change', () => {
    loadBooks({ title: searchInput?.value?.trim() || '', genre: genreSelect.value });
  });
}

// Init
loadBooks();


//inoltre quando sono in catalago (e sono già loggato come admin) se clicclo il collegamento nella navbar per la gestione del profilo, mi fa vedere il profilo dell'utente e non dell'admin

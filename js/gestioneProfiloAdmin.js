// js/gestioneProfiloAdmin.js

const API_BASE_URL = 'http://localhost:8080';

let books = [];
let selectedBook = null;

// DOM elements
const container = document.getElementById('books-container');
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const genreSelect = document.getElementById('genreFilter');
const modalOverlay = document.getElementById('book-modal');

const addBookSection = document.getElementById('add-book-section');
const addBookForm = document.getElementById('add-book-form');
const messageContainer = document.getElementById('message-container');

const toggleAddBookBtn = document.getElementById('toggleAddBookBtn');
const cancelAddBookBtn = document.getElementById('cancelAddBookBtn');
const logoutBtn = document.getElementById('logoutBtn');

// =====================
// Utility auth
// =====================
function getToken() {
  return localStorage.getItem('authToken');
}

function authHeaders() {
  const token = getToken();
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

// =====================
// Verifica accesso admin
// =====================
async function checkAdminAccess() {
  const token = getToken();
  if (!token) {
    alert('Accesso negato. Devi essere autenticato come admin.');
    window.location.href = 'login.html';
    return false;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, { headers: authHeaders() });
    if (!res.ok) {
      window.location.href = 'login.html';
      return false;
    }
    const data = await res.json();
    const role = data.role || (Array.isArray(data.roles) ? data.roles[0] : '') || '';

    if (role !== 'ROLE_ADMIN' && role !== 'ADMIN' && !role.toUpperCase().includes('ADMIN')) {
      alert('Accesso negato. Solo gli amministratori possono accedere a questa pagina.');
      window.location.href = 'catalog.html';
      return false;
    }

    return true;
  } catch (err) {
    console.error('Errore verifica admin:', err);
    window.location.href = 'login.html';
    return false;
  }
}

// =====================
// Caricamento libri
// =====================
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

  books.forEach((book) => {
    const card = document.createElement('div');
    card.className = 'book-card book-card-admin';
    card.dataset.id = book.id;

    const cover = book.coverImageUrl || 'img/logo.png';
    const authors = book.author || 'Autore sconosciuto';
    const year = book.publicationYear ? ` · ${book.publicationYear}` : '';
    const copies = book.copiesAvailable ?? 'N/D';

    card.innerHTML = `
      <img src="${cover}" alt="Copertina libro" onerror="this.src='img/logo.png'">
      <h3>${book.title}</h3>
      <p>${authors}${year}</p>
      <p class="author">Genere: ${book.genre || 'N/D'}</p>
      <p class="author">Copie disponibili: ${copies}</p>
      <div class="admin-buttons">
        <button class="btn-admin btn-delete" data-action="delete">Elimina</button>
        <button class="btn-admin btn-add" data-action="details">Dettagli</button>
      </div>
    `;

    // Eventi pulsanti
    const deleteBtn = card.querySelector('[data-action="delete"]');
    const detailBtn = card.querySelector('[data-action="details"]');

    deleteBtn.addEventListener('click', () => deleteBook(book.id));
    detailBtn.addEventListener('click', () => openModal(book.id));

    container.appendChild(card);
  });
}

// =====================
// Modal libro
// =====================
async function openModal(bookId) {
  let book = books.find((b) => b.id === bookId);
  if (!book) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/books/${bookId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Errore ${res.status}`);
      book = await res.json();
    } catch (err) {
      showMessage('Errore nel caricamento del libro', 'error');
      return;
    }
  }

  selectedBook = book;

  document.getElementById('modal-title').textContent =
    selectedBook.title || 'Titolo non disponibile';
  document.getElementById('modal-authors').textContent =
    selectedBook.author || 'Autore sconosciuto';
  document.getElementById('modal-categories').textContent =
    selectedBook.genre ? `Genere: ${selectedBook.genre}` : 'Genere non disponibile';
  document.getElementById('modal-published').textContent = selectedBook.publicationYear
    ? `Pubblicato: ${selectedBook.publicationYear}`
    : 'Anno non disponibile';
  document.getElementById('modal-description').textContent =
    selectedBook.description || 'Nessuna descrizione disponibile.';

  const coverImg = document.getElementById('modal-cover');
  coverImg.src = selectedBook.coverImageUrl || 'img/logo.png';

  const copies = selectedBook.copiesAvailable ?? 0;
  document.getElementById('modal-availability').textContent = `Disponibile (${copies} copie)`;

  // Reset recensioni
  const reviewsContent = document.getElementById('reviews-content');
  const reviewsToggle = document.getElementById('reviews-toggle');
  const reviewsList = document.getElementById('reviews-list');
  const reviewsCount = document.getElementById('reviews-count');

  if (reviewsContent) reviewsContent.style.display = 'none';
  if (reviewsToggle) reviewsToggle.classList.remove('expanded');
  if (reviewsList) reviewsList.innerHTML = '<div class="loading">Caricamento recensioni...</div>';
  if (reviewsCount) reviewsCount.textContent = '(0)';

  // Carica recensioni
  loadReviews(selectedBook.id);

  modalOverlay.classList.add('show');
}

function closeModal() {
  modalOverlay.classList.remove('show');
  selectedBook = null;
}

// =====================
// Elimina libro
// =====================
async function deleteBook(bookId) {
  if (!confirm('Sei sicuro di voler eliminare questo libro? Questa azione è irreversibile.')) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/admin/books/${bookId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || `Errore ${res.status}`);
    }

    showMessage('Libro eliminato con successo!', 'success');
    await loadBooks({
      title: searchInput?.value?.trim() || '',
      genre: genreSelect?.value || '',
    });
  } catch (err) {
    console.error('Errore eliminazione libro:', err);
    showMessage("Errore nell'eliminazione del libro: " + err.message, 'error');
  }
}

// =====================
// Aggiungi libro
// =====================
async function onAddBookSubmit(e) {
  e.preventDefault();

  const bookData = {
    title: document.getElementById('book-title').value.trim(),
    author: document.getElementById('book-author').value.trim(),
    genre: document.getElementById('book-genre').value,
    publicationYear: document.getElementById('book-year').value
      ? parseInt(document.getElementById('book-year').value, 10)
      : null,
    copiesAvailable: parseInt(document.getElementById('book-copies').value, 10) || 0,
    coverImageUrl: document.getElementById('book-cover').value.trim() || null,
    description: document.getElementById('book-description').value.trim() || null,
  };

  try {
    const res = await fetch(`${API_BASE_URL}/admin/books`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(bookData),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || `Errore ${res.status}`);
    }

    showMessage('Libro aggiunto con successo!', 'success');
    addBookForm.reset();
    toggleAddBookForm();
    await loadBooks({
      title: searchInput?.value?.trim() || '',
      genre: genreSelect?.value || '',
    });
  } catch (err) {
    console.error('Errore aggiunta libro:', err);
    showMessage("Errore nell'aggiunta del libro: " + err.message, 'error');
  }
}

// =====================
// Recensioni
// =====================
async function loadReviews(bookId) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/books/${bookId}/reviews`, {
      headers: authHeaders(),
    });

    if (!res.ok) {
      if (res.status === 404) {
        renderReviews([]);
        return;
      }
      throw new Error(`Errore ${res.status}`);
    }

    const reviews = await res.json();
    renderReviews(reviews);
  } catch (err) {
    console.error('Errore nel caricamento recensioni:', err);
    const reviewsList = document.getElementById('reviews-list');
    const reviewsCount = document.getElementById('reviews-count');
    if (reviewsList) {
      reviewsList.innerHTML =
        '<div class="no-reviews">Errore nel caricare le recensioni.</div>';
    }
    if (reviewsCount) reviewsCount.textContent = '(0)';
  }
}

function renderReviews(reviews) {
  const reviewsList = document.getElementById('reviews-list');
  const reviewsCount = document.getElementById('reviews-count');

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
          day: 'numeric',
        })
        : '';

      return `
        <div class="review-item review-admin-item">
          <div class="review-header">
            <span class="review-user">${review.username || 'Utente'}</span>
            <div class="review-rating">${stars}</div>
          </div>
          ${review.comment ? `<div class="review-comment">${review.comment}</div>` : ''}
          ${date ? `<div class="review-date">${date}</div>` : ''}
          <button class="btn-admin btn-delete review-delete-btn"
                  onclick="deleteReview(${review.id}, ${selectedBook.id})">
            Elimina
          </button>
        </div>
      `;
    })
    .join('');
}

// eliminazione recensione (resta globale per l’onclick inline)
async function deleteReview(reviewId, bookId) {
  if (!confirm('Sei sicuro di voler eliminare questa recensione?')) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/admin/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || `Errore ${res.status}`);
    }

    showMessage('Recensione eliminata con successo!', 'success');
    await loadReviews(bookId);
  } catch (err) {
    console.error('Errore eliminazione recensione:', err);
    showMessage("Errore nell'eliminazione della recensione: " + err.message, 'error');
  }
}

// =====================
// Utility UI
// =====================
function toggleAddBookForm() {
  addBookSection.classList.toggle('hidden');
}

function showMessage(message, type = 'success') {
  const className =
    type === 'success' ? 'success-message' : 'error-message-custom';
  messageContainer.innerHTML = `<div class="${className}">${message}</div>`;
  setTimeout(() => {
    messageContainer.innerHTML = '';
  }, 5000);
}

// =====================
// Logout
// =====================
function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
  localStorage.removeItem('userRole');
  window.location.href = 'login.html';
}

// =====================
// Event listeners
// =====================
document.addEventListener('DOMContentLoaded', async () => {
  const isAdmin = await checkAdminAccess();
  if (!isAdmin) return;

  await loadBooks();

  // Modal
  const closeBtn = document.querySelector('.book-modal-close');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  const reviewsToggle = document.getElementById('reviews-toggle');
  const reviewsContent = document.getElementById('reviews-content');
  if (reviewsToggle && reviewsContent) {
    reviewsToggle.addEventListener('click', () => {
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

  const modalDeleteBtn = document.getElementById('modal-delete-book');
  if (modalDeleteBtn) {
    modalDeleteBtn.addEventListener('click', () => {
      if (selectedBook) {
        deleteBook(selectedBook.id);
        closeModal();
      }
    });
  }

  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      loadBooks({
        title: searchInput.value.trim(),
        genre: genreSelect?.value || '',
      });
    });
  }

  if (genreSelect) {
    genreSelect.addEventListener('change', () => {
      loadBooks({
        title: searchInput?.value?.trim() || '',
        genre: genreSelect.value,
      });
    });
  }

  if (addBookForm) {
    addBookForm.addEventListener('submit', onAddBookSubmit);
  }

  if (toggleAddBookBtn) {
    toggleAddBookBtn.addEventListener('click', toggleAddBookForm);
  }
  if (cancelAddBookBtn) {
    cancelAddBookBtn.addEventListener('click', toggleAddBookForm);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
});

// Rendo deleteReview visibile globalmente (per l’onclick inline)
window.deleteReview = deleteReview;

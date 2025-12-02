// API Backend Spring Boot
const API_URL = "http://localhost:8080/api/books";

// Variabili per la paginazione
let books = [];
let currentPage = 1;
const booksPerPage = 12; // Ridotto a 12 per una migliore visualizzazione

// Contenitori DOM
const container = document.getElementById("books-container");
const paginationContainer = document.getElementById("pagination");

// Carica i libri dal backend
async function loadBooks() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Errore HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      container.innerHTML = "<p style='text-align: center; grid-column: 1 / -1; padding: 2rem; color: #666;'>Nessun libro disponibile al momento.</p>";
      return;
    }

    // I dati arrivano già come array diretto dal backend
    books = data;

    renderPage();

  } catch (error) {
    console.error('Errore nel caricamento dei libri:', error);
    container.innerHTML = `
      <div style="text-align: center; grid-column: 1 / -1; padding: 2rem; color: #d32f2f;">
        <p>Errore nel caricamento dei libri.</p>
        <p style="font-size: 0.9rem; margin-top: 0.5rem;">Assicurati che il backend sia avviato su http://localhost:8080</p>
      </div>
    `;
  }
}

// Mostra i libri della pagina corrente
function renderPage() {
  if (!container) return;

  container.innerHTML = "";

  const start = (currentPage - 1) * booksPerPage;
  const end = start + booksPerPage;

  const pageBooks = books.slice(start, end);

  pageBooks.forEach(book => {
    const card = createBookCard(book);
    container.appendChild(card);
  });

  renderPaginationButtons();
}

// Crea una card libro
function createBookCard(book) {
  const card = document.createElement("div");
  card.classList.add("book-card");

  // Usa la copertina reale se disponibile, altrimenti placeholder
  let imageUrl;
  if (book.coverImageUrl) {
    imageUrl = book.coverImageUrl;
  } else {
    // Placeholder con iniziali del titolo
    const initials = (book.title || 'L').substring(0, 2).toUpperCase();
    imageUrl = `https://via.placeholder.com/150x220/597A88/ffffff?text=${encodeURIComponent(initials)}`;
  }

  // Costruisce il rating se disponibile
  let ratingHtml = '';
  if (book.averageRating && book.averageRating > 0) {
    const stars = '⭐'.repeat(Math.round(book.averageRating));
    ratingHtml = `<p style="color: #f39c12; font-size: 0.85rem; margin-top: 0.5rem;">${stars} ${book.averageRating.toFixed(1)}</p>`;
  }

  const title = book.title || "Titolo non disponibile";
  const author = book.author || "Autore sconosciuto";
  const year = book.publicationYear || "N/A";
  const genre = book.genre || "N/A";
  const copies = book.copiesAvailable || 0;
  const description = book.description || "";

  card.innerHTML = `
    <img src="${imageUrl}" alt="Copertina ${escapeHtml(title)}" onerror="this.onerror=null; this.src='https://via.placeholder.com/150x220/597A88/ffffff?text=${encodeURIComponent((title.substring(0, 2)).toUpperCase())}'">
    <h3>${escapeHtml(title)}</h3>
    <p class="author">${escapeHtml(author)}</p>
    <p><strong>Anno:</strong> ${year}</p>
    <p><strong>Genere:</strong> ${escapeHtml(genre)}</p>
    <p style="font-size: 0.8rem; color: #666; margin-top: 0.5rem;">
      <strong>Copie disponibili:</strong> ${copies}
    </p>
    ${ratingHtml}
  `;

  // Click handler per i dettagli (opzionale)
  card.addEventListener('click', () => {
    console.log('Libro cliccato:', book.id);
    // Puoi implementare qui la navigazione ai dettagli
    // window.location.href = `book-details.html?id=${book.id}`;
  });

  return card;
}

// Funzione per evitare XSS (escape HTML)
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Bottoni di paginazione
function renderPaginationButtons() {
  if (!paginationContainer) return;

  paginationContainer.innerHTML = "";

  const totalPages = Math.ceil(books.length / booksPerPage);

  if (totalPages <= 1) {
    return; // Non mostra paginazione se c'è solo una pagina
  }

  if (currentPage > 1) {
    const prev = document.createElement("button");
    prev.textContent = "← Indietro";
    prev.onclick = () => {
      currentPage--;
      renderPage();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    paginationContainer.appendChild(prev);
  }

  const info = document.createElement("span");
  info.textContent = `Pagina ${currentPage} di ${totalPages}`;
  paginationContainer.appendChild(info);

  if (currentPage < totalPages) {
    const next = document.createElement("button");
    next.textContent = "Avanti →";
    next.onclick = () => {
      currentPage++;
      renderPage();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    paginationContainer.appendChild(next);
  }
}

// Carica i libri quando la pagina è pronta
document.addEventListener("DOMContentLoaded", () => {
  console.log("Caricamento catalogo dal backend...");
  loadBooks();
});

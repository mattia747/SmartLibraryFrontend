// ===============================
// Configurazione Google Books (catalogo iniziale multi-genere)
// ===============================

// Lingua: solo libri in italiano (lato API)
const LANG = "it";

// Ogni voce è una query diversa, con generi misti
const SEARCH_TERMS = [
  "subject:fiction",
  "subject:fantasy",
  "subject:romance",
  "subject:thriller",
  "subject:history",
  "subject:science",
  "subject:philosophy",
  "subject:technology",
  "subject:mystery",
  "subject:biography"
];

// Quanti risultati per ogni query (max 40 consentito)
const MAX_RESULTS_PER_TERM = 40;

// Per la ricerca libera (barra "Cerca un libro")
const SEARCH_RESULTS_PER_REQUEST = 40;      // max 40
const SEARCH_TOTAL_REQUESTS = 5;            // 3 richieste → fino a ~120 risultati

// ===============================
// Variabili per la paginazione e stato
// ===============================
let books = [];
let currentPage = 1;
const booksPerPage = 56; // quanti libri mostrare per pagina

// modalità: "default" (multi-genere) oppure "search"
let currentMode = "default";
let lastSearchQuery = "";

// filtro genere (valore del select)
let currentGenreFilter = "";

// indice del libro attualmente mostrato nel modal
let currentDetailIndex = null;

// ===============================
// Contenitori DOM
// ===============================
const container = document.getElementById("books-container");
const paginationContainer = document.getElementById("pagination");

// elementi per la ricerca
const searchForm = document.querySelector(".search-bar");
const searchInput = document.getElementById("searchInput");
const genreSelect = document.getElementById("genreFilter");

// elementi per il modal
const modalOverlay = document.getElementById("book-modal");
const modalCover = document.getElementById("modal-cover");
const modalTitle = document.getElementById("modal-title");
const modalAuthors = document.getElementById("modal-authors");
const modalCategories = document.getElementById("modal-categories");
const modalPublished = document.getElementById("modal-published");
const modalDescription = document.getElementById("modal-description");
const modalBookButton = document.getElementById("modal-book-button");
const modalPrev = document.getElementById("modal-prev");
const modalNext = document.getElementById("modal-next");
const modalCloseBtn = document.querySelector(".book-modal-close");
const modalAvailability = document.getElementById("modal-availability");

// ===============================
// Eventi: ricerca, filtro, modal
// ===============================

// Submit della barra di ricerca
if (searchForm && searchInput) {
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();

    if (!query) {
      // se l'utente cancella la ricerca → torna al catalogo generale
      currentMode = "default";
      lastSearchQuery = "";
      loadDefaultBooks();
    } else {
      currentMode = "search";
      lastSearchQuery = query;
      loadSearchBooks(query);
    }
  });
}

// Cambio del filtro genere
if (genreSelect) {
  genreSelect.addEventListener("change", () => {
    currentGenreFilter = genreSelect.value;
    currentPage = 1;
    renderPage();
  });
}

// Chiusura modal (X)
if (modalCloseBtn) {
  modalCloseBtn.addEventListener("click", closeModal);
}

// Chiusura modal cliccando fuori (sull'overlay)
if (modalOverlay) {
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });
}

// Navigazione prev / next nel modal
if (modalPrev) {
  modalPrev.addEventListener("click", () => {
    if (currentDetailIndex === null) return;
    const filteredBooks = getFilteredBooks();
    if (currentDetailIndex > 0) {
      openModal(currentDetailIndex - 1, filteredBooks);
    }
  });
}

if (modalNext) {
  modalNext.addEventListener("click", () => {
    if (currentDetailIndex === null) return;
    const filteredBooks = getFilteredBooks();
    if (currentDetailIndex < filteredBooks.length - 1) {
      openModal(currentDetailIndex + 1, filteredBooks);
    }
  });
}

// button Prenota (solo il model)
if (modalBookButton) {
  modalBookButton.addEventListener("click", () => {
    const filteredBooks = getFilteredBooks();
    if (currentDetailIndex === null || !filteredBooks[currentDetailIndex]) return;
    const book = filteredBooks[currentDetailIndex];
    console.log("Prenota libro:", book.id, book.volumeInfo.title);
    alert("Prenotazione confermata!");
  });
}

// ESC e frecce per navigare nel modal
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
  } else if (e.key === "ArrowRight") {
    const filteredBooks = getFilteredBooks();
    if (
      modalOverlay &&
      modalOverlay.classList.contains("show") &&
      currentDetailIndex !== null &&
      currentDetailIndex < filteredBooks.length - 1
    ) {
      openModal(currentDetailIndex + 1, filteredBooks);
    }
  } else if (e.key === "ArrowLeft") {
    if (
      modalOverlay &&
      modalOverlay.classList.contains("show") &&
      currentDetailIndex !== null &&
      currentDetailIndex > 0
    ) {
      const filteredBooks = getFilteredBooks();
      openModal(currentDetailIndex - 1, filteredBooks);
    }
  }
});

// ===============================
// Funzioni di filtro
// ===============================

// solo libri con copertina
function filterValidBooks(items) {
  return items.filter(
    (item) =>
      item.volumeInfo &&
      item.volumeInfo.imageLinks &&
      item.volumeInfo.imageLinks.thumbnail
  );
}

// match generico con genere
function matchesGenre(book, genreValue) {
  if (!genreValue) return true; // "Tutti i generi"

  const info = book.volumeInfo;
  const categories = info.categories || [];
  const joinedText =
    (categories.join(" ") + " " + (info.description || "")).toLowerCase();

  return joinedText.includes(genreValue.toLowerCase());
}

// ritorna l'elenco di libri dopo il filtro per genere
function getFilteredBooks() {
  if (!currentGenreFilter) return books;
  return books.filter((book) => matchesGenre(book, currentGenreFilter));
}

// Stub per disponibilità (qui poi colleghi il backend)
function getBookAvailability(book) {
  // TODO: integra con backend:
  // ad es. chiamata al tuo server passando book.id o ISBN
  // Per ora assumiamo che sia sempre disponibile
  return true;
}

// ===============================
// Utility: mescola array in modo random
// ===============================
function shuffleArray(array) {
  const arr = [...array]; // copia per sicurezza
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ===============================
// Modal: apertura / chiusura / popolamento
// ===============================
function openModal(globalIndex, filteredBooksParam) {
  const filteredBooks = filteredBooksParam || getFilteredBooks();

  if (!filteredBooks[globalIndex]) return;

  currentDetailIndex = globalIndex;

  const book = filteredBooks[globalIndex];
  const info = book.volumeInfo || {};

  const title = info.title || "Titolo non disponibile";
  const authors = info.authors ? info.authors.join(", ") : "Autore sconosciuto";
  const categories = info.categories ? info.categories.join(" · ") : "";

  // Estrazione ANNO da publishedDate (YYYY, YYYY-MM, YYYY-MM-DD)
  let year = "";
  if (info.publishedDate) {
    const match = info.publishedDate.match(/\d{4}/);
    if (match) year = match[0];
  }

  // Estrazione ISBN (preferenza ISBN_13 poi ISBN_10)
  let isbn = "";
  if (info.industryIdentifiers && info.industryIdentifiers.length > 0) {
    const isbn13 = info.industryIdentifiers.find(
      (id) => id.type === "ISBN_13"
    );
    const isbn10 = info.industryIdentifiers.find(
      (id) => id.type === "ISBN_10"
    );
    const chosen = isbn13 || isbn10 || info.industryIdentifiers[0];
    isbn = chosen.identifier;
  }

  let pubLine = "";
  if (year || isbn) {
    pubLine = "Pubblicato: " + (year ? year : "N/D");
    if (isbn) pubLine += "<br>ISBN: " + isbn;
  }

  const description =
    info.description ||
    "Nessuna descrizione disponibile per questo libro.";

  const cover =
    info.imageLinks && (info.imageLinks.large || info.imageLinks.thumbnail)
      ? info.imageLinks.large || info.imageLinks.thumbnail
      : "";

  if (modalTitle) modalTitle.textContent = title;
  if (modalAuthors) modalAuthors.textContent = authors;
  if (modalCategories)
    modalCategories.textContent = categories
      ? `Categorie: ${categories}`
      : "Categorie non disponibili";
  if (modalPublished)
    modalPublished.innerHTML =
      pubLine || "Dettagli di pubblicazione non disponibili";
  if (modalDescription) modalDescription.textContent = description;
  if (modalCover) {
    if (cover) {
      modalCover.src = cover;
      modalCover.style.display = "block";
    } else {
      modalCover.style.display = "none";
    }
  }

  // Disponibilità + stato bottone
  if (modalAvailability) {
    const available = getBookAvailability(book);
    modalAvailability.classList.remove("available", "unavailable");

    if (available) {
      modalAvailability.textContent = "Disponibile";
      modalAvailability.classList.add("available");
      if (modalBookButton) modalBookButton.disabled = false;
    } else {
      modalAvailability.textContent = "Non disponibile";
      modalAvailability.classList.add("unavailable");
      if (modalBookButton) modalBookButton.disabled = true;
    }
  }

  // gestisci stato bottoni prev/next
  if (modalPrev) {
    modalPrev.disabled = globalIndex === 0;
  }
  if (modalNext) {
    modalNext.disabled = globalIndex === filteredBooks.length - 1;
  }

  if (modalOverlay) {
    modalOverlay.classList.add("show");
  }
}

function closeModal() {
  if (modalOverlay) {
    modalOverlay.classList.remove("show");
  }
  currentDetailIndex = null;
}

// ===============================
// Caricamento catalogo iniziale (multi-genere)
// ===============================
async function loadDefaultBooks() {
  books = [];
  currentPage = 1;

  container.innerHTML = "<p>Caricamento dei libri in corso...</p>";
  paginationContainer.innerHTML = "";

  try {
    const tempBooks = [];

    // Per ogni genere/termine
    for (const term of SEARCH_TERMS) {
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
        term
      )}&maxResults=${MAX_RESULTS_PER_TERM}&langRestrict=${LANG}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        console.error("Errore API Google Books:", data.error);
        continue;
      }

      if (data.items && Array.isArray(data.items)) {
        const filtered = filterValidBooks(data.items);
        tempBooks.push(...filtered);
      }
    }

    // Elimina duplicati basandosi su book.id
    const uniqueMap = new Map();
    for (const book of tempBooks) {
      if (!uniqueMap.has(book.id)) {
        uniqueMap.set(book.id, book);
      }
    }

    // converto in array e mescolo per avere ordine random ogni volta
    books = shuffleArray(Array.from(uniqueMap.values()));

    if (books.length === 0) {
      container.innerHTML =
        "<p>Nessun libro trovato (prova a rimuovere il filtro lingua o cambiare generi).</p>";
      return;
    }

    renderPage();
  } catch (error) {
    console.error("Errore nel caricamento dei libri:", error);
    container.innerHTML =
      "<p>Si è verificato un errore durante il caricamento dei libri.</p>";
  }
}

// ===============================
// Caricamento libri per ricerca utente
// ===============================
async function loadSearchBooks(query) {
  books = [];
  currentPage = 1;

  container.innerHTML = `<p>Sto cercando libri (IT) per: <strong>${query}</strong>...</p>`;
  paginationContainer.innerHTML = "";

  try {
    const tempBooks = [];

    // più richieste per avere più risultati (paginando con startIndex)
    for (let i = 0; i < SEARCH_TOTAL_REQUESTS; i++) {
      const startIndex = i * SEARCH_RESULTS_PER_REQUEST;
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
        query
      )}&maxResults=${SEARCH_RESULTS_PER_REQUEST}&startIndex=${startIndex}&langRestrict=${LANG}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        console.error("Errore API Google Books (search):", data.error);
        break;
      }

      if (data.items && Array.isArray(data.items)) {
        const filtered = filterValidBooks(data.items);
        tempBooks.push(...filtered);
      } else {
        // se non arrivano più items, fermiamo il ciclo
        break;
      }
    }

    // rimozione duplicati
    const uniqueMap = new Map();
    for (const book of tempBooks) {
      if (!uniqueMap.has(book.id)) {
        uniqueMap.set(book.id, book);
      }
    }
    books = Array.from(uniqueMap.values());

    if (books.length === 0) {
      container.innerHTML = `<p>Nessun risultato trovato (in italiano) per: <strong>${query}</strong>.</p>`;
      return;
    }

    renderPage();
  } catch (error) {
    console.error("Errore nella ricerca libri:", error);
    container.innerHTML =
      "<p>Si è verificato un errore durante la ricerca dei libri.</p>";
  }
}

// ===============================
// Mostra i libri della pagina corrente
// ===============================
function renderPage() {
  container.innerHTML = "";

  const filteredBooks = getFilteredBooks();

  if (filteredBooks.length === 0) {
    container.innerHTML = "<p>Nessun libro trovato per questo filtro.</p>";
    paginationContainer.innerHTML = "";
    return;
  }

  const start = (currentPage - 1) * booksPerPage;
  const end = start + booksPerPage;

  const pageBooks = filteredBooks.slice(start, end);

  pageBooks.forEach((book, idx) => {
    const info = book.volumeInfo;

    const title = info.title || "Titolo non disponibile";
    const authors = info.authors
      ? info.authors.join(", ")
      : "Autore sconosciuto";
    const cover = info.imageLinks.thumbnail;

    const card = document.createElement("div");
    card.classList.add("book-card");

    // indice globale rispetto all'intera lista filtrata
    const globalIndex = start + idx;
    card.dataset.index = globalIndex;

    card.innerHTML = `
      <img src="${cover}" alt="Copertina libro">
      <h3>${title}</h3>
      <p>${authors}</p>
    `;

    // click sulla card → apri modal dettaglio
    card.addEventListener("click", () => {
      openModal(globalIndex, filteredBooks);
    });

    container.appendChild(card);
  });

  renderPaginationButtons();
}

// ===============================
// Bottoni di paginazione
// ===============================
function renderPaginationButtons() {
  paginationContainer.innerHTML = "";

  const filteredBooks = getFilteredBooks();
  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);

  if (totalPages <= 1) return;

  if (currentPage > 1) {
    const prev = document.createElement("button");
    prev.textContent = "← Indietro";
    prev.onclick = () => {
      currentPage--;
      renderPage();
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
    };
    paginationContainer.appendChild(next);
  }
}

// ===============================
// Avvio: carica il catalogo iniziale
// ===============================
loadDefaultBooks();

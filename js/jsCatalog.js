// API Google Books
const API_URL = "https://www.googleapis.com/books/v1/volumes?q=thriller";

// Variabili per la paginazione
let books = [];
let currentPage = 1;
const booksPerPage = 50;

// Contenitori DOM
const container = document.getElementById("books-container");
const paginationContainer = document.getElementById("pagination");

// Carica i libri
async function loadBooks() {
  const response = await fetch(API_URL);
  const data = await response.json();

  if (!data.items) {
    container.innerHTML = "<p>Nessun libro trovato.</p>";
    return;
  }

  // Filtro: solo libri con copertina
  books = data.items.filter(item =>
    item.volumeInfo.imageLinks && item.volumeInfo.imageLinks.thumbnail
  );

  renderPage();
}

// Mostra i libri della pagina corrente
function renderPage() {
  container.innerHTML = "";

  const start = (currentPage - 1) * booksPerPage;
  const end = start + booksPerPage;

  const pageBooks = books.slice(start, end);

  pageBooks.forEach(book => {
    const info = book.volumeInfo;

    const title = info.title || "Titolo non disponibile";
    const authors = info.authors ? info.authors.join(", ") : "Autore sconosciuto";
    const cover = info.imageLinks.thumbnail;

    const card = document.createElement("div");
    card.classList.add("book-card");

    card.innerHTML = `
      <img src="${cover}" alt="Copertina libro">
      <h3>${title}</h3>
      <p>${authors}</p>
    `;

    container.appendChild(card);
  });

  renderPaginationButtons();
}

// Bottoni di paginazione
function renderPaginationButtons() {
  paginationContainer.innerHTML = "";

  const totalPages = Math.ceil(books.length / booksPerPage);

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

loadBooks();

// Configuration de l'application
const CONFIG = {
    GOOGLE_BOOKS_API: 'https://www.googleapis.com/books/v1/volumes',
    OPENLIBRARY_API: 'https://openlibrary.org/api/books',
    OPENLIBRARY_COVERS: 'https://covers.openlibrary.org/b/isbn',
    STORAGE_KEY: 'myLibraryBooks',
    selectedRating: 0,
    tempCoverUrl: null,
    currentSearchQuery: '',
    currentSearchFilter: 'all',
    currentSearchStartIndex: 0
};

// Variables globales
let lastSearchTime = 0;
let books = [];
let filteredBooks = [];
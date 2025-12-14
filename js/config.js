// Configuration de l'application
const CONFIG = {
    GOOGLE_BOOKS_API: 'https://www.googleapis.com/books/v1/volumes',
    OPENLIBRARY_API: 'https://openlibrary.org/api/books',
    OPENLIBRARY_COVERS: 'https://covers.openlibrary.org/b/isbn',
    STORAGE_KEY: 'myLibraryBooks',
    GENRES_KEY: 'myLibraryGenres',
    TAGS_KEY: 'myLibraryTags',
    COLLECTIONS_KEY: 'myLibraryCollections',
    selectedRating: 0,
    tempCoverUrl: null,
    tempGenres: [],
    currentSearchQuery: '',
    currentSearchFilter: 'all',
    currentSearchStartIndex: 0
};

// Genres prédéfinis
const DEFAULT_GENRES = [
    'Roman',
    'Science-Fiction',
    'Fantasy',
    'Thriller',
    'Policier',
    'Romance',
    'Horreur',
    'Biographie',
    'Autobiographie',
    'Histoire',
    'Philosophie',
    'Psychologie',
    'Développement personnel',
    'Sciences',
    'Économie',
    'Politique',
    'Essai',
    'Poésie',
    'Théâtre',
    'BD',
    'Manga',
    'Jeunesse',
    'Cuisine',
    'Voyage',
    'Art',
    'Religion',
    'Spiritualité',
    'Humour',
    'Classique',
    'Contemporain'
];

// Variables globales
let lastSearchTime = 0;
let books = [];
let filteredBooks = [];
let libraryGenres = [];
let libraryTags = [];
let libraryCollections = [];
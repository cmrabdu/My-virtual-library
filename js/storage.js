// Gestion du localStorage
function loadBooks() {
    const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
    books = stored ? JSON.parse(stored) : [];
    filteredBooks = [...books];
    
    // Charger les genres, tags et collections
    loadLibraryMetadata();
}

function saveBooks() {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(books));
}

// Charger les métadonnées (genres, tags, collections)
function loadLibraryMetadata() {
    // Genres
    const storedGenres = localStorage.getItem(CONFIG.GENRES_KEY);
    if (storedGenres) {
        libraryGenres = JSON.parse(storedGenres);
    } else {
        // Initialiser avec les genres par défaut
        libraryGenres = [...DEFAULT_GENRES];
        saveGenres();
    }
    
    // Tags
    const storedTags = localStorage.getItem(CONFIG.TAGS_KEY);
    libraryTags = storedTags ? JSON.parse(storedTags) : [];
    
    // Collections
    const storedCollections = localStorage.getItem(CONFIG.COLLECTIONS_KEY);
    if (storedCollections) {
        libraryCollections = JSON.parse(storedCollections);
    } else {
        // Collection "Favoris" par défaut
        libraryCollections = [
            { id: 1, name: 'Favoris', icon: '⭐', createdAt: new Date().toISOString() }
        ];
        saveCollections();
    }
}

function saveGenres() {
    localStorage.setItem(CONFIG.GENRES_KEY, JSON.stringify(libraryGenres));
}

function saveTags() {
    localStorage.setItem(CONFIG.TAGS_KEY, JSON.stringify(libraryTags));
}

function saveCollections() {
    localStorage.setItem(CONFIG.COLLECTIONS_KEY, JSON.stringify(libraryCollections));
}

// Ajouter un nouveau genre (s'il n'existe pas déjà)
function addGenre(genre) {
    const trimmed = genre.trim();
    if (trimmed && !libraryGenres.includes(trimmed)) {
        libraryGenres.push(trimmed);
        libraryGenres.sort((a, b) => a.localeCompare(b, 'fr'));
        saveGenres();
        return true;
    }
    return false;
}

// Ajouter un nouveau tag
function addTag(tag) {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !libraryTags.includes(trimmed)) {
        libraryTags.push(trimmed);
        libraryTags.sort((a, b) => a.localeCompare(b, 'fr'));
        saveTags();
        return true;
    }
    return false;
}

// Ajouter une nouvelle collection
function addCollection(name, icon = '📚') {
    const trimmed = name.trim();
    if (trimmed && !libraryCollections.find(c => c.name === trimmed)) {
        libraryCollections.push({
            id: Date.now(),
            name: trimmed,
            icon: icon,
            createdAt: new Date().toISOString()
        });
        saveCollections();
        return true;
    }
    return false;
}

// Export de la bibliothèque
function exportLibrary() {
    const dataStr = JSON.stringify(books, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ma-bibliotheque-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showMessage('📤 Bibliothèque exportée !', 'success');
}
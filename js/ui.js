// Gestion de l'interface utilisateur et des interactions

// Genres for add book form
let addBookGenres = [];

// État des filtres avancés
let activeFilters = {
    status: '',
    genre: '',
    collection: '',
    tag: '',
    search: ''
};

function handleAddBook(event) {
    event.preventDefault();
    const isbn = document.getElementById('isbn').value.trim();
    const title = document.getElementById('title').value.trim();
    const author = document.getElementById('author').value.trim();
    const pages = document.getElementById('pages').value.trim();
    const status = document.getElementById('status').value;
    const rating = parseInt(document.getElementById('rating').value) || 0;
    const summary = document.getElementById('summary').value.trim();
    const learnings = document.getElementById('learnings') ? document.getElementById('learnings').value.trim() : '';

    if (!title || !author) {
        showMessage('⚠️ Veuillez remplir tous les champs obligatoires.', 'warning');
        return;
    }

    // Récupérer la couverture stockée temporairement ou construire l'URL
    let cover = CONFIG.tempCoverUrl || 'https://via.placeholder.com/128x192?text=Livre';
    if (!CONFIG.tempCoverUrl && isbn) {
        const cleanIsbn = isbn.replace(/[-\s]/g, '');
        cover = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-M.jpg`;
    }

    const newBook = {
        id: Date.now(),
        isbn: isbn || '',
        title,
        author,
        pages: pages || '',
        cover,
        status: status || 'to-read',
        rating,
        summary,
        learnings,
        genres: [...addBookGenres],
        tags: [],
        collections: [],
        currentPage: 0,
        addedDate: new Date().toLocaleDateString('fr-FR')
    };

    books.push(newBook);
    filteredBooks = [...books];
    saveBooks();
    
    // Reset complet
    event.target.reset();
    resetRating();
    resetAddBookGenres();
    CONFIG.tempCoverUrl = null;
    CONFIG.tempGenres = [];
    
    // Mettre à jour toutes les vues
    updateStats();
    updateHomePage();
    displayBooks();
    
    showMessage('✅ Livre ajouté avec succès !', 'success');
    
    // Navigation douce vers l'accueil
    setTimeout(() => navigateTo('home'), 800);
}

// ========================================
// ADD BOOK GENRES MANAGEMENT
// ========================================

function renderAddBookGenres() {
    const container = document.getElementById('addGenresChips');
    if (!container) return;
    
    if (addBookGenres.length === 0) {
        container.innerHTML = '<span class="chips-empty">Aucun genre sélectionné</span>';
        return;
    }
    
    container.innerHTML = addBookGenres.map(genre => `
        <span class="chip chip-genre">
            ${genre}
            <button type="button" class="chip-remove" onclick="removeAddBookGenre('${genre}')" title="Supprimer">×</button>
        </span>
    `).join('');
}

function removeAddBookGenre(genre) {
    addBookGenres = addBookGenres.filter(g => g !== genre);
    renderAddBookGenres();
}

function addAddBookGenre(genre) {
    const trimmed = genre.trim();
    if (trimmed && !addBookGenres.includes(trimmed)) {
        addBookGenres.push(trimmed);
        addGenre(trimmed); // Add to library genres
        renderAddBookGenres();
    }
    const input = document.getElementById('addGenreInput');
    if (input) input.value = '';
    hideSuggestions('addGenreSuggestions');
}

function showAddGenreSuggestions(query) {
    const suggestionsEl = document.getElementById('addGenreSuggestions');
    if (!suggestionsEl) return;
    
    const trimmedQuery = query.trim().toLowerCase();
    
    // Filter genres (show all if empty, filter if typing)
    let filtered;
    if (!trimmedQuery) {
        filtered = libraryGenres.filter(genre => 
            !addBookGenres.includes(genre)
        ).slice(0, 10);
    } else {
        filtered = libraryGenres.filter(genre => 
            genre.toLowerCase().includes(trimmedQuery) && 
            !addBookGenres.includes(genre)
        ).slice(0, 8);
    }
    
    const exactMatch = libraryGenres.some(g => g.toLowerCase() === trimmedQuery);
    
    let html = filtered.map(genre => `
        <div class="chip-suggestion" onclick="addAddBookGenre('${genre}')">${genre}</div>
    `).join('');
    
    if (!exactMatch && trimmedQuery.length >= 2) {
        const capitalizedQuery = query.trim().charAt(0).toUpperCase() + query.trim().slice(1);
        html += `<div class="chip-suggestion chip-suggestion-new" onclick="addAddBookGenre('${capitalizedQuery}')">Créer "${capitalizedQuery}"</div>`;
    }
    
    if (html) {
        suggestionsEl.innerHTML = html;
        suggestionsEl.classList.add('active');
    } else {
        hideSuggestions('addGenreSuggestions');
    }
}

function resetAddBookGenres() {
    addBookGenres = [];
    renderAddBookGenres();
}

function initAddBookGenres() {
    const input = document.getElementById('addGenreInput');
    if (input) {
        input.addEventListener('focus', () => {
            showAddGenreSuggestions(input.value);
        });
        input.addEventListener('input', (e) => {
            showAddGenreSuggestions(e.target.value);
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const value = e.target.value.trim();
                if (value) {
                    addAddBookGenre(value.charAt(0).toUpperCase() + value.slice(1));
                }
            }
        });
        input.addEventListener('blur', () => {
            setTimeout(() => hideSuggestions('addGenreSuggestions'), 200);
        });
    }
    renderAddBookGenres();
}

function displayBooks() {
    const container = document.getElementById('booksList');
    const loading = document.getElementById('loadingBooks');
    const emptyState = document.getElementById('emptyState');

    if (!container) return;
    container.innerHTML = '';
    if (loading) loading.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';

    // Mise à jour du compteur de livres
    const libraryCount = document.getElementById('libraryCount');
    if (libraryCount) {
        const count = books.length;
        libraryCount.textContent = `${count} livre${count > 1 ? 's' : ''}`;
    }

    // Mise à jour des statistiques rapides
    const toReadCount = document.getElementById('toReadCount');
    const readingCount = document.getElementById('readingCount');
    const readCount = document.getElementById('readCount');
    if (toReadCount) toReadCount.textContent = books.filter(b => b.status === 'to-read').length;
    if (readingCount) readingCount.textContent = books.filter(b => b.status === 'reading').length;
    if (readCount) readCount.textContent = books.filter(b => b.status === 'read').length;

    if (filteredBooks.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    filteredBooks.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card clickable';
        bookCard.setAttribute('role', 'button');
        bookCard.setAttribute('tabindex', '0');
        bookCard.onclick = (e) => {
            // Don't open modal if clicking on interactive elements
            if (e.target.closest('.delete-btn') || e.target.closest('.status-badge') || e.target.closest('.interactive-stars')) return;
            openBookModal(book.id);
        };
        bookCard.innerHTML = `
            <div class="book-cover-wrapper">
                ${renderBookCover(book)}
                ${book.rating > 0 ? `<div class="book-rating-badge">${'★'.repeat(book.rating)}</div>` : ''}
            </div>
            <div class="book-info">
                <h3>${book.title}</h3>
                <p class="book-author">${book.author}</p>
                ${book.isbn ? `<p class="book-isbn">ISBN: ${book.isbn}</p>` : ''}
                <div class="book-status" style="cursor: pointer;" onclick="event.stopPropagation(); editBookStatus(${book.id})" title="Cliquer pour changer le statut">
                    <span class="status-badge status-${book.status}">${getStatusLabel(book.status)}</span>
                </div>
                ${book.genres && book.genres.length > 0 ? `
                <div class="book-genres-mini" onclick="event.stopPropagation();">
                    ${book.genres.slice(0, 2).map(g => `<span class="genre-chip-mini">${g}</span>`).join('')}
                    ${book.genres.length > 2 ? `<span class="genre-chip-mini more">+${book.genres.length - 2}</span>` : ''}
                </div>` : ''}
                <div class="book-rating" style="margin: 8px 0;" onclick="event.stopPropagation();">
                    <div class="stars interactive-stars" data-book-id="${book.id}">
                        ${renderInteractiveStars(book.rating, book.id)}
                    </div>
                    ${book.rating > 0 ? `<small style="color: #64748b;">${book.rating}/5</small>` : '<small style="color: #94a3b8;">Cliquer sur une étoile</small>'}
                </div>
                ${book.pages ? renderProgressBar(book) : ''}
                ${book.summary ? `<p class="book-summary" style="font-size: 0.85rem; color: #64748b; margin: 8px 0; line-height: 1.4;">${book.summary.substring(0, 100)}${book.summary.length > 100 ? '...' : ''}</p>` : ''}
                <div class="book-actions">
                    <button class="delete-btn" onclick="event.stopPropagation(); deleteBook(${book.id})" title="Supprimer le livre">🗑️</button>
                </div>
            </div>
        `;
        container.appendChild(bookCard);
    });
}

function deleteBook(id) {
    if (!confirm('Supprimer ce livre ?')) return;

    books = books.filter(b => b.id !== id);
    filteredBooks = filteredBooks.filter(b => b.id !== id);
    saveBooks();
    displayBooks();
    updateStats();
    updateHomePage();
    showMessage('🗑️ Livre supprimé.', 'info');
}

function updateStats() {
    const total = books.length;
    const toRead = books.filter(b => b.status === 'to-read').length;
    const reading = books.filter(b => b.status === 'reading').length;
    const read = books.filter(b => b.status === 'read').length;
    const ratedBooks = books.filter(b => b.rating > 0);
    const avgRating = ratedBooks.length > 0 
        ? (ratedBooks.reduce((sum, b) => sum + b.rating, 0) / ratedBooks.length).toFixed(1)
        : 0;

    // Stats générales (plusieurs endroits)
    const totalElements = ['totalBooks', 'totalBooks2', 'profileTotalBooks'];
    totalElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = total;
    });

    const toReadEl = document.getElementById('toReadBooks');
    const readingEl = document.getElementById('currentlyReading');
    const readEls = ['readBooks', 'profileReadBooks'];

    if (toReadEl) toReadEl.textContent = toRead;
    if (readingEl) readingEl.textContent = reading;
    readEls.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = read;
    });

    const avgEls = document.querySelectorAll('#averageRating');
    avgEls.forEach(el => el.textContent = avgRating);

    updateCharts();
}

function bindEvents() {
    const form = document.getElementById('bookForm');
    if (form) {
        form.addEventListener('submit', handleAddBook);
    }

    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', async () => {
            const isbn = document.getElementById('isbn').value.trim();
            if (!isbn) {
                showMessage('⚠️ Veuillez entrer un ISBN.', 'warning');
                return;
            }
            
            searchBtn.disabled = true;
            searchBtn.textContent = '⏳ Recherche...';
            
            const bookData = await searchBookByISBN(isbn);
            
            if (bookData) {
                document.getElementById('title').value = bookData.title || '';
                document.getElementById('author').value = bookData.author || '';
                document.getElementById('summary').value = bookData.summary || '';
                if (bookData.pages) document.getElementById('pages').value = bookData.pages;
                
                // Stocker l'URL de la couverture temporairement
                CONFIG.tempCoverUrl = bookData.cover || null;
                
                document.getElementById('isbn').value = '';
                showMessage('📖 Livre trouvé !', 'success');
            } else {
                showMessage('❌ Livre non trouvé.', 'error');
                CONFIG.tempCoverUrl = null;
            }
            
            searchBtn.disabled = false;
            searchBtn.textContent = '🔍 Rechercher';
        });
    }

    // Bouton de scan ISBN
    const scanBtn = document.getElementById('scanBtn');
    if (scanBtn) {
        scanBtn.addEventListener('click', handleISBNScan);
    }

    // Gestion des filtres par statut (chips)
    const statusChips = document.querySelectorAll('.status-chip');
    statusChips.forEach(chip => {
        chip.addEventListener('click', () => {
            statusChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            
            const status = chip.dataset.status;
            activeFilters.status = status;
            applyFilters();
        });
    });

    const searchBooks = document.getElementById('searchBooks');
    if (searchBooks) {
        searchBooks.addEventListener('input', (e) => {
            activeFilters.search = e.target.value.trim();
            applyFilters();
        });
    }
    
    // Initialiser les filtres avancés
    initAdvancedFilters();

    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportLibrary);
    }

    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('⚠️ ATTENTION ⚠️\n\nÊtes-vous sûr de vouloir supprimer TOUTE votre bibliothèque ?\n\nCette action est IRRÉVERSIBLE !')) {
                if (confirm('Dernière confirmation : Supprimer définitivement tous les livres ?')) {
                    books = [];
                    filteredBooks = [];
                    saveBooks();
                    displayBooks();
                    updateStats();
                    updateHomePage();
                    showMessage('🗑️ Bibliothèque supprimée', 'info');
                }
            }
        });
    }

    const starsContainer = document.getElementById('starRating');
    setupStarRating(starsContainer);
}

function showMessage(message, type = 'info') {
    // Supprimer les anciens toasts si trop nombreux
    const existingToasts = document.querySelectorAll('.toast-notification');
    if (existingToasts.length >= 3) {
        existingToasts[0].remove();
    }
    
    // Configuration par type
    const config = {
        success: { icon: '✓', bg: 'linear-gradient(135deg, #10b981, #059669)', iconBg: 'rgba(255,255,255,0.2)' },
        error: { icon: '✕', bg: 'linear-gradient(135deg, #ef4444, #dc2626)', iconBg: 'rgba(255,255,255,0.2)' },
        warning: { icon: '!', bg: 'linear-gradient(135deg, #f59e0b, #d97706)', iconBg: 'rgba(255,255,255,0.2)' },
        info: { icon: 'i', bg: 'linear-gradient(135deg, #3b82f6, #2563eb)', iconBg: 'rgba(255,255,255,0.2)' }
    };
    
    const { icon, bg, iconBg } = config[type] || config.info;
    
    // Créer le conteneur de toasts s'il n'existe pas
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10000;
            display: flex; flex-direction: column; gap: 12px;
            pointer-events: none;
        `;
        document.body.appendChild(toastContainer);
    }
    
    // Créer le toast
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = `
        display: flex; align-items: center; gap: 12px;
        padding: 16px 20px; min-width: 280px; max-width: 400px;
        background: ${bg}; color: white;
        border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        pointer-events: auto; cursor: pointer;
        transform: translateX(120%); opacity: 0;
        transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        overflow: hidden; position: relative;
    `;
    
    toast.innerHTML = `
        <div style="
            width: 32px; height: 32px; border-radius: 50%;
            background: ${iconBg}; display: flex; align-items: center;
            justify-content: center; font-weight: bold; font-size: 16px;
            flex-shrink: 0;
        ">${icon}</div>
        <div style="flex: 1; font-weight: 500; font-size: 14px; line-height: 1.4;">
            ${message}
        </div>
        <button style="
            background: none; border: none; color: white; opacity: 0.7;
            cursor: pointer; font-size: 18px; padding: 0; margin-left: 8px;
            transition: opacity 0.2s;
        " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'"
        onclick="this.parentElement.style.transform='translateX(120%)'; this.parentElement.style.opacity='0'; setTimeout(() => this.parentElement.remove(), 300);">×</button>
        <div style="
            position: absolute; bottom: 0; left: 0; height: 3px;
            background: rgba(255,255,255,0.4); width: 100%;
            animation: toastProgress 3s linear forwards;
        "></div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Animation d'entrée
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
    });
    
    // Fermer au clic
    toast.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') {
            toast.style.transform = 'translateX(120%)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }
    });
    
    // Auto-fermeture après 3 secondes
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.transform = 'translateX(120%)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }
    }, 3000);
}

// Ajouter les keyframes pour la barre de progression
if (!document.getElementById('toastStyles')) {
    const style = document.createElement('style');
    style.id = 'toastStyles';
    style.textContent = `
        @keyframes toastProgress {
            from { width: 100%; }
            to { width: 0%; }
        }
        .toast-notification:hover div[style*="animation: toastProgress"] {
            animation-play-state: paused;
        }
    `;
    document.head.appendChild(style);
}

function resetRating() {
    CONFIG.selectedRating = 0;
    const stars = document.querySelectorAll('#starRating .star');
    stars.forEach(star => {
        star.classList.remove('active');
        star.textContent = '☆';
    });
    const ratingInput = document.getElementById('rating');
    if (ratingInput) ratingInput.value = 0;
}

function setupStarRating(container) {
    if (!container) return;
    const stars = container.querySelectorAll('.star');
    stars.forEach((star, index) => {
        star.addEventListener('click', () => setRating(index + 1, stars));
        star.addEventListener('mouseenter', () => highlightStars(index + 1, stars));
    });
    container.addEventListener('mouseleave', () => highlightStars(CONFIG.selectedRating, stars));
}

// Fonctions utilitaires
function getStatusLabel(status) {
    const labels = {
        'to-read': '📚 À lire',
        'reading': '📖 En cours',
        'read': '✅ Lu'
    };
    return labels[status] || status;
}

function renderStars(rating) {
    return Array.from({length: 5}, (_, i) => 
        i < rating ? '<span class="star active">★</span>' : '<span class="star">☆</span>'
    ).join('');
}

function renderBookCover(book) {
    const hasValidImage = book.cover && 
                          !book.cover.includes('placeholder') && 
                          !book.cover.includes('via.placeholder');
    
    if (hasValidImage) {
        return `<img src="${book.cover}" alt="${book.title}" class="book-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
    } else {
        // Afficher le titre tronqué dans la couverture
        const truncatedTitle = book.title.length > 40 ? book.title.substring(0, 40) + '...' : book.title;
        return `<div class="book-cover book-cover-text">${truncatedTitle}</div>`;
    }
}

function renderInteractiveStars(currentRating, bookId) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        const filled = i <= currentRating;
        stars += `<span class="star-clickable" 
                       data-rating="${i}" 
                       onclick="setBookRating(${bookId}, ${i})"
                       style="cursor: pointer; font-size: 20px; transition: transform 0.2s;"
                       onmouseover="this.style.transform='scale(1.2)'"
                       onmouseout="this.style.transform='scale(1)'"
                       title="Noter ${i}/5">${filled ? '⭐' : '☆'}</span>`;
    }
    return stars;
}

function renderProgressBar(book) {
    const totalPages = parseInt(book.pages) || 0;
    const currentPage = parseInt(book.currentPage) || 0;
    const percentage = totalPages > 0 ? Math.min(100, Math.round((currentPage / totalPages) * 100)) : 0;
    
    return `
        <div class="book-progress" style="margin: 12px 0;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <input type="number" 
                       value="${currentPage}" 
                       min="0" 
                       max="${totalPages}"
                       placeholder="Page"
                       onchange="updateBookProgress(${book.id}, this.value)"
                       style="width: 70px; padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;"
                       title="Page actuelle" />
                <span style="color: #64748b; font-size: 13px;">/ ${totalPages} pages</span>
                <span style="color: #3b82f6; font-weight: 600; font-size: 13px; margin-left: auto;">${percentage}%</span>
            </div>
            <div class="progress-bar-container" style="width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                <div class="progress-bar-fill" style="width: ${percentage}%; height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); transition: width 0.3s ease;"></div>
            </div>
        </div>
    `;
}

function editBookStatus(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    const statuses = ['to-read', 'reading', 'read'];
    const currentIndex = statuses.indexOf(book.status);
    const nextIndex = (currentIndex + 1) % statuses.length;
    
    book.status = statuses[nextIndex];
    saveBooks();
    displayBooks();
    updateStats();
    updateHomePage();
    showMessage(`📌 Statut: ${getStatusLabel(book.status)}`, 'info');
}

function setBookRating(bookId, rating) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    book.rating = rating;
    saveBooks();
    displayBooks();
    updateStats();
    updateHomePage();
    showMessage(`⭐ ${rating}/5`, 'success');
}

function updateBookProgress(bookId, currentPage) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    const page = parseInt(currentPage) || 0;
    const totalPages = parseInt(book.pages) || 0;
    
    if (page > totalPages) {
        showMessage('⚠️ La page ne peut pas dépasser le total', 'warning');
        displayBooks();
        return;
    }

    book.currentPage = page;
    
    // Si le lecteur atteint la dernière page, marquer comme "Lu"
    if (page === totalPages && totalPages > 0 && book.status !== 'read') {
        book.status = 'read';
        showMessage(`🎉 Livre terminé ! Statut mis à jour: Lu`, 'success');
    } else if (page > 0 && book.status === 'to-read') {
        // Si le lecteur commence à lire, passer en "En cours"
        book.status = 'reading';
    }

    saveBooks();
    displayBooks();
    updateStats();
    updateHomePage();
    
    const percentage = totalPages > 0 ? Math.round((page / totalPages) * 100) : 0;
    if (page < totalPages) {
        showMessage(`📖 Progression: ${percentage}%`, 'info');
    }
}

function editBookRating(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    const newRating = prompt(`Note actuelle: ${book.rating}/5\n\nNouvelle note (0-5):`, book.rating || '');
    if (newRating === null) return;

    const rating = parseInt(newRating);
    if (isNaN(rating) || rating < 0 || rating > 5) {
        showMessage('⚠️ Note invalide (0-5).', 'warning');
        return;
    }

    book.rating = rating;
    saveBooks();
    displayBooks();
    updateStats();
    updateHomePage();
    showMessage(`⭐ Note mise à jour: ${rating}/5`, 'success');
}

function viewBookDetails(bookId) {
    openBookModal(bookId);
}

// ========================================
// BOOK MODAL MANAGEMENT
// ========================================

let currentModalBookId = null;
let currentModalGenres = [];
let currentModalTags = [];

function openBookModal(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    
    currentModalBookId = bookId;
    currentModalGenres = book.genres ? [...book.genres] : [];
    currentModalTags = book.tags ? [...book.tags] : [];
    currentModalCollections = book.collections ? [...book.collections] : [];
    
    const modal = document.getElementById('bookModalOverlay');
    if (!modal) return;
    
    // Populate modal with book data
    const coverEl = document.getElementById('modalCover');
    const titleEl = document.getElementById('modalTitle');
    const authorEl = document.getElementById('modalAuthor');
    const pagesEl = document.getElementById('modalPages');
    const isbnEl = document.getElementById('modalIsbn');
    const statusBadge = document.getElementById('modalStatus');
    const summaryEl = document.getElementById('modalSummary');
    const learningsEl = document.getElementById('modalLearnings');
    const dateEl = document.getElementById('modalDate');
    const progressSection = document.getElementById('modalProgressSection');
    const progressFill = document.getElementById('modalProgressFill');
    const currentPageInput = document.getElementById('modalCurrentPage');
    const totalPagesEl = document.getElementById('modalTotalPages');
    
    // Set cover image with fallback
    if (coverEl) {
        const coverUrl = book.cover || 'https://via.placeholder.com/180x270?text=Livre';
        coverEl.style.backgroundImage = `url('${coverUrl}')`;
        coverEl.style.backgroundSize = 'cover';
        coverEl.style.backgroundPosition = 'center';
    }
    
    // Set basic info
    if (titleEl) titleEl.textContent = book.title;
    if (authorEl) authorEl.textContent = book.author;
    if (pagesEl) pagesEl.textContent = book.pages ? `${book.pages} pages` : '';
    if (isbnEl) isbnEl.textContent = book.isbn ? `ISBN: ${book.isbn}` : '';
    if (dateEl) dateEl.textContent = `Ajouté le ${book.addedDate}`;
    
    // Set status badge
    if (statusBadge) {
        statusBadge.className = `modal-status-badge status-${book.status}`;
        statusBadge.textContent = getStatusLabel(book.status);
    }
    
    // Set status selector
    const statusBtns = modal.querySelectorAll('.modal-status-option');
    statusBtns.forEach(btn => {
        const status = btn.dataset.status;
        btn.classList.toggle('active', status === book.status);
    });
    
    // Set rating
    setModalRating(book.rating || 0);
    
    // Set genres and tags
    renderModalGenres();
    renderModalTags();
    renderModalCollections();
    
    // Set progress section (only for books with pages)
    if (progressSection) {
        if (book.pages && book.status === 'reading') {
            progressSection.style.display = 'block';
            const currentPage = book.currentPage || 0;
            const totalPages = parseInt(book.pages) || 1;
            const percent = Math.round((currentPage / totalPages) * 100);
            
            if (progressFill) progressFill.style.width = `${percent}%`;
            if (currentPageInput) currentPageInput.value = currentPage;
            if (totalPagesEl) totalPagesEl.textContent = `/ ${totalPages}`;
        } else {
            progressSection.style.display = 'none';
        }
    }
    
    // Set text areas
    if (summaryEl) summaryEl.value = book.summary || '';
    if (learningsEl) learningsEl.value = book.learnings || '';
    
    // Show modal with animation
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
    document.body.style.overflow = 'hidden';
}

// ========================================
// GENRES & TAGS CHIPS MANAGEMENT
// ========================================

function renderModalGenres() {
    const container = document.getElementById('modalGenresChips');
    if (!container) return;
    
    if (currentModalGenres.length === 0) {
        container.innerHTML = '<span class="chips-empty">Aucun genre</span>';
        return;
    }
    
    container.innerHTML = currentModalGenres.map(genre => `
        <span class="chip chip-genre">
            ${genre}
            <button class="chip-remove" onclick="removeModalGenre('${genre}')" title="Supprimer">×</button>
        </span>
    `).join('');
}

function renderModalTags() {
    const container = document.getElementById('modalTagsChips');
    if (!container) return;
    
    if (currentModalTags.length === 0) {
        container.innerHTML = '<span class="chips-empty">Aucun tag</span>';
        return;
    }
    
    container.innerHTML = currentModalTags.map(tag => `
        <span class="chip chip-tag">
            ${tag}
            <button class="chip-remove" onclick="removeModalTag('${tag}')" title="Supprimer">×</button>
        </span>
    `).join('');
}

function removeModalGenre(genre) {
    currentModalGenres = currentModalGenres.filter(g => g !== genre);
    renderModalGenres();
}

function removeModalTag(tag) {
    currentModalTags = currentModalTags.filter(t => t !== tag);
    renderModalTags();
}

function addModalGenre(genre) {
    const trimmed = genre.trim();
    if (trimmed && !currentModalGenres.includes(trimmed)) {
        currentModalGenres.push(trimmed);
        // Also add to library genres if new
        addGenre(trimmed);
        renderModalGenres();
    }
    // Clear input
    const input = document.getElementById('modalGenreInput');
    if (input) input.value = '';
    hideSuggestions('genreSuggestions');
}

function addModalTag(tag) {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !currentModalTags.includes(trimmed)) {
        currentModalTags.push(trimmed);
        // Also add to library tags if new
        addTag(trimmed);
        renderModalTags();
    }
    // Clear input
    const input = document.getElementById('modalTagInput');
    if (input) input.value = '';
    hideSuggestions('tagSuggestions');
}

function showGenreSuggestions(query) {
    const suggestionsEl = document.getElementById('genreSuggestions');
    if (!suggestionsEl) return;
    
    const trimmedQuery = query.trim().toLowerCase();
    
    // Filter genres that match query (or all if empty) and aren't already selected
    let filtered;
    if (!trimmedQuery) {
        // Show all available genres when empty
        filtered = libraryGenres.filter(genre => 
            !currentModalGenres.includes(genre)
        ).slice(0, 10);
    } else {
        filtered = libraryGenres.filter(genre => 
            genre.toLowerCase().includes(trimmedQuery) && 
            !currentModalGenres.includes(genre)
        ).slice(0, 8);
    }
    
    // Check if exact match exists
    const exactMatch = libraryGenres.some(g => g.toLowerCase() === trimmedQuery);
    
    let html = filtered.map(genre => `
        <div class="chip-suggestion" onclick="addModalGenre('${genre}')">${genre}</div>
    `).join('');
    
    // Add "create new" option if no exact match
    if (!exactMatch && trimmedQuery.length >= 2) {
        const capitalizedQuery = query.trim().charAt(0).toUpperCase() + query.trim().slice(1);
        html += `<div class="chip-suggestion chip-suggestion-new" onclick="addModalGenre('${capitalizedQuery}')">Créer "${capitalizedQuery}"</div>`;
    }
    
    if (html) {
        suggestionsEl.innerHTML = html;
        suggestionsEl.classList.add('active');
    } else {
        hideSuggestions('genreSuggestions');
    }
}

function showTagSuggestions(query) {
    const suggestionsEl = document.getElementById('tagSuggestions');
    if (!suggestionsEl) return;
    
    const trimmedQuery = query.trim().toLowerCase();
    
    if (!trimmedQuery) {
        hideSuggestions('tagSuggestions');
        return;
    }
    
    // Filter tags that match query and aren't already selected
    const filtered = libraryTags.filter(tag => 
        tag.toLowerCase().includes(trimmedQuery) && 
        !currentModalTags.includes(tag)
    ).slice(0, 6);
    
    // Check if exact match exists
    const exactMatch = libraryTags.some(t => t.toLowerCase() === trimmedQuery);
    
    let html = filtered.map(tag => `
        <div class="chip-suggestion" onclick="addModalTag('${tag}')">${tag}</div>
    `).join('');
    
    // Add "create new" option if no exact match
    if (!exactMatch && trimmedQuery.length >= 2) {
        html += `<div class="chip-suggestion chip-suggestion-new" onclick="addModalTag('${trimmedQuery}')">Créer "${trimmedQuery}"</div>`;
    }
    
    if (html) {
        suggestionsEl.innerHTML = html;
        suggestionsEl.classList.add('active');
    } else {
        hideSuggestions('tagSuggestions');
    }
}

function hideSuggestions(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
}

function closeBookModal() {
    const modal = document.getElementById('bookModalOverlay');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
        document.body.style.overflow = '';
        currentModalGenres = [];
        currentModalTags = [];
        currentModalCollections = [];
        currentModalBookId = null;
    }
}

function setModalRating(rating) {
    const starsContainer = document.getElementById('modalRating');
    if (!starsContainer) return;
    
    const stars = starsContainer.querySelectorAll('.modal-star');
    stars.forEach((star, index) => {
        star.classList.toggle('active', index < rating);
        star.textContent = index < rating ? '★' : '☆';
    });
    
    // Store current rating
    starsContainer.dataset.rating = rating;
}

function handleModalStarClick(starIndex) {
    setModalRating(starIndex + 1);
}

function handleModalStatusClick(btn) {
    const modal = document.getElementById('bookModalOverlay');
    if (!modal) return;
    
    const statusBtns = modal.querySelectorAll('.modal-status-option');
    statusBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Update progress section visibility
    const status = btn.dataset.status;
    const progressSection = document.getElementById('modalProgressSection');
    const book = books.find(b => b.id === currentModalBookId);
    
    if (progressSection && book) {
        progressSection.style.display = (status === 'reading' && book.pages) ? 'block' : 'none';
    }
}

function updateModalProgress() {
    if (!currentModalBookId) return;
    
    const book = books.find(b => b.id === currentModalBookId);
    if (!book) return;
    
    const currentPageInput = document.getElementById('modalCurrentPage');
    const progressFill = document.getElementById('modalProgressFill');
    
    if (currentPageInput) {
        const currentPage = parseInt(currentPageInput.value) || 0;
        const totalPages = parseInt(book.pages) || 1;
        const validPage = Math.max(0, Math.min(currentPage, totalPages));
        
        book.currentPage = validPage;
        currentPageInput.value = validPage;
        
        const percent = Math.round((validPage / totalPages) * 100);
        if (progressFill) progressFill.style.width = `${percent}%`;
        
        saveBooks();
        showMessage(`📖 Progression: ${validPage}/${totalPages} pages (${percent}%)`, 'success');
    }
}

function saveBookDetails() {
    if (!currentModalBookId) return;
    
    const book = books.find(b => b.id === currentModalBookId);
    if (!book) return;
    
    const modal = document.getElementById('bookModalOverlay');
    if (!modal) return;
    
    // Get status
    const activeStatusBtn = modal.querySelector('.modal-status-option.active');
    if (activeStatusBtn) {
        book.status = activeStatusBtn.dataset.status;
    }
    
    // Get rating
    const starsContainer = document.getElementById('modalRating');
    if (starsContainer) {
        book.rating = parseInt(starsContainer.dataset.rating) || 0;
    }
    
    // Get progress
    const currentPageInput = document.getElementById('modalCurrentPage');
    if (currentPageInput && book.pages) {
        book.currentPage = parseInt(currentPageInput.value) || 0;
    }
    
    // Get genres, tags and collections
    book.genres = [...currentModalGenres];
    book.tags = [...currentModalTags];
    book.collections = [...currentModalCollections];
    
    // Get text values
    const summaryEl = document.getElementById('modalSummary');
    const learningsEl = document.getElementById('modalLearnings');
    
    if (summaryEl) book.summary = summaryEl.value.trim();
    if (learningsEl) book.learnings = learningsEl.value.trim();
    
    // Save and update
    saveBooks();
    displayBooks();
    updateStats();
    updateHomePage();
    renderCollectionsGrid();
    
    showMessage('✅ Livre mis à jour !', 'success');
    closeBookModal();
}

function deleteBookFromModal() {
    if (!currentModalBookId) return;
    
    const book = books.find(b => b.id === currentModalBookId);
    if (!book) return;
    
    if (!confirm(`Supprimer "${book.title}" ?`)) return;
    
    books = books.filter(b => b.id !== currentModalBookId);
    filteredBooks = filteredBooks.filter(b => b.id !== currentModalBookId);
    saveBooks();
    displayBooks();
    updateStats();
    updateHomePage();
    
    showMessage('🗑️ Livre supprimé.', 'info');
    closeBookModal();
}

// Initialize modal event listeners
function initBookModal() {
    const modal = document.getElementById('bookModalOverlay');
    if (!modal) return;
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeBookModal();
        }
    });
    
    // Close button
    const closeBtn = document.getElementById('closeBookModal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeBookModal);
    }
    
    // Status buttons
    const statusBtns = modal.querySelectorAll('.modal-status-option');
    statusBtns.forEach(btn => {
        btn.addEventListener('click', () => handleModalStatusClick(btn));
    });
    
    // Rating stars
    const starsContainer = document.getElementById('modalRating');
    if (starsContainer) {
        const stars = starsContainer.querySelectorAll('.modal-star');
        stars.forEach((star, index) => {
            star.addEventListener('click', () => handleModalStarClick(index));
            star.addEventListener('mouseenter', () => {
                stars.forEach((s, i) => {
                    s.textContent = i <= index ? '★' : '☆';
                });
            });
        });
        
        starsContainer.addEventListener('mouseleave', () => {
            const currentRating = parseInt(starsContainer.dataset.rating) || 0;
            stars.forEach((s, i) => {
                s.textContent = i < currentRating ? '★' : '☆';
            });
        });
    }
    
    // Genre input
    const genreInput = document.getElementById('modalGenreInput');
    if (genreInput) {
        genreInput.addEventListener('focus', () => {
            showGenreSuggestions(genreInput.value);
        });
        genreInput.addEventListener('input', (e) => {
            showGenreSuggestions(e.target.value);
        });
        genreInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const value = e.target.value.trim();
                if (value) {
                    addModalGenre(value.charAt(0).toUpperCase() + value.slice(1));
                }
            }
        });
        genreInput.addEventListener('blur', () => {
            // Delay to allow click on suggestion
            setTimeout(() => hideSuggestions('genreSuggestions'), 200);
        });
    }
    
    // Tag input
    const tagInput = document.getElementById('modalTagInput');
    if (tagInput) {
        tagInput.addEventListener('input', (e) => {
            showTagSuggestions(e.target.value);
        });
        tagInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const value = e.target.value.trim();
                if (value) {
                    addModalTag(value);
                }
            }
        });
        tagInput.addEventListener('blur', () => {
            // Delay to allow click on suggestion
            setTimeout(() => hideSuggestions('tagSuggestions'), 200);
        });
    }
    
    // Update progress button
    const updateProgressBtn = document.getElementById('updateProgressBtn');
    if (updateProgressBtn) {
        updateProgressBtn.addEventListener('click', updateModalProgress);
    }
    
    // Save button
    const saveBtn = document.getElementById('saveBookChanges');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveBookDetails);
    }
    
    // Delete button
    const deleteBtn = document.getElementById('deleteBookModal');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', deleteBookFromModal);
    }
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeBookModal();
        }
    });
}

function highlightStars(count, stars) {
    stars.forEach((star, index) => {
        if (index < count) {
            star.classList.add('active');
            star.textContent = '★';
        } else {
            star.classList.remove('active');
            star.textContent = '☆';
        }
    });
}

function setRating(rating, stars) {
    CONFIG.selectedRating = rating;
    highlightStars(rating, stars);
    const ratingInput = document.getElementById('rating');
    if (ratingInput) ratingInput.value = rating;
}

/**
 * Handle ISBN scanning from camera
 */
async function handleISBNScan() {
    const cameraInput = document.getElementById('cameraInput');
    const scanBtn = document.getElementById('scanBtn');
    const isbnInput = document.getElementById('isbn');
    
    if (!cameraInput || !scanBtn || !isbnInput) return;
    
    // Trigger camera input
    cameraInput.click();
    
    cameraInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Show loading state
        const originalText = scanBtn.innerHTML;
        scanBtn.innerHTML = '⏳ Analyse...';
        scanBtn.disabled = true;
        
        try {
            console.log('Scanning file:', file.name, file.type);
            const isbn = await scanBarcodeFromImage(file);
            
            if (isbn) {
                isbnInput.value = isbn;
                showMessage('✅ Code-barres détecté: ' + isbn, 'success');
                
                // Auto-trigger search
                setTimeout(() => {
                    const searchBtn = document.getElementById('searchBtn');
                    if (searchBtn) searchBtn.click();
                }, 500);
            } else {
                showMessage('❌ Code-barres non détecté. Assurez-vous que le code-barres est bien visible et centré, puis réessayez.', 'warning');
            }
        } catch (error) {
            console.error('Scan error:', error);
            showMessage('❌ Erreur lors du scan. Veuillez réessayer.', 'error');
        } finally {
            // Reset button state
            scanBtn.innerHTML = originalText;
            scanBtn.disabled = false;
            cameraInput.value = ''; // Reset file input
        }
    };
}

// Gérer les boutons de sélection de statut
document.addEventListener('DOMContentLoaded', () => {
    const statusOptions = document.querySelectorAll('.status-option');
    const statusInput = document.getElementById('status');
    
    statusOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Retirer active de tous les boutons
            statusOptions.forEach(opt => opt.classList.remove('active'));
            
            // Ajouter active au bouton cliqué
            option.classList.add('active');
            
            // Mettre à jour le input hidden
            const selectedStatus = option.dataset.status;
            statusInput.value = selectedStatus;
            
            // Gérer l'affichage des champs conditionnels
            toggleReadOnlyFields();
        });
    });
    
    // Initialize book modal
    initBookModal();
    
    // Initialize add book genres
    initAddBookGenres();
    
    // Initialize collections
    initCollections();
});

// Gérer l'affichage conditionnel des champs selon le statut
function toggleReadOnlyFields() {
    const statusInput = document.getElementById('status');
    const ratingGroup = document.getElementById('ratingGroup');
    const summaryGroup = document.getElementById('summaryGroup');
    const learningsGroup = document.getElementById('learningsGroup');
    
    if (!statusInput || !summaryGroup || !learningsGroup) return;
    
    const isRead = statusInput.value === 'read';
    
    // Afficher/masquer les champs selon le statut
    if (ratingGroup) {
        ratingGroup.style.display = isRead ? 'block' : 'none';
    }
    summaryGroup.style.display = isRead ? 'block' : 'none';
    learningsGroup.style.display = isRead ? 'block' : 'none';
}

// ========================================
// COLLECTIONS MANAGEMENT
// ========================================

let currentModalCollections = [];
let selectedCollectionIcon = '📚';

function renderCollectionsGrid() {
    const grid = document.getElementById('collectionsGrid');
    if (!grid) return;
    
    if (libraryCollections.length === 0) {
        grid.innerHTML = '<div class="collections-empty">Aucune collection. Créez-en une !</div>';
        return;
    }
    
    grid.innerHTML = libraryCollections.map(collection => {
        const bookCount = books.filter(b => b.collections && b.collections.includes(collection.name)).length;
        return `
            <div class="collection-card" onclick="openCollectionView('${collection.name}')">
                <button class="collection-delete" onclick="event.stopPropagation(); deleteCollection(${collection.id})" title="Supprimer">×</button>
                <div class="collection-icon">${collection.icon}</div>
                <div class="collection-name">${collection.name}</div>
                <div class="collection-count">${bookCount} livre${bookCount > 1 ? 's' : ''}</div>
            </div>
        `;
    }).join('');
}

function renderModalCollections() {
    const container = document.getElementById('modalCollections');
    if (!container) return;
    
    if (libraryCollections.length === 0) {
        container.innerHTML = '<div class="collections-empty">Aucune collection créée</div>';
        return;
    }
    
    container.innerHTML = libraryCollections.map(collection => {
        const isChecked = currentModalCollections.includes(collection.name);
        return `
            <div class="collection-checkbox ${isChecked ? 'checked' : ''}" onclick="toggleModalCollection('${collection.name}')">
                <span class="collection-checkbox-icon">${collection.icon}</span>
                <span class="collection-checkbox-name">${collection.name}</span>
                <span class="collection-checkbox-check">${isChecked ? '✓' : ''}</span>
            </div>
        `;
    }).join('');
}

function toggleModalCollection(collectionName) {
    if (currentModalCollections.includes(collectionName)) {
        currentModalCollections = currentModalCollections.filter(c => c !== collectionName);
    } else {
        currentModalCollections.push(collectionName);
    }
    renderModalCollections();
}

function openCreateCollectionModal() {
    const modal = document.getElementById('createCollectionModal');
    if (modal) {
        modal.style.display = 'flex';
        selectedCollectionIcon = '📚';
        const nameInput = document.getElementById('newCollectionName');
        if (nameInput) {
            nameInput.value = '';
            nameInput.focus();
        }
        // Reset icon selection
        const iconBtns = modal.querySelectorAll('.collection-icon-btn');
        iconBtns.forEach(btn => btn.classList.remove('active'));
        const firstBtn = modal.querySelector('.collection-icon-btn[data-icon="📚"]');
        if (firstBtn) firstBtn.classList.add('active');
    }
}

function closeCreateCollectionModal() {
    const modal = document.getElementById('createCollectionModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function createNewCollection() {
    const nameInput = document.getElementById('newCollectionName');
    if (!nameInput) return;
    
    const name = nameInput.value.trim();
    if (!name) {
        showMessage('⚠️ Veuillez entrer un nom pour la collection', 'warning');
        return;
    }
    
    if (libraryCollections.find(c => c.name.toLowerCase() === name.toLowerCase())) {
        showMessage('⚠️ Une collection avec ce nom existe déjà', 'warning');
        return;
    }
    
    const success = addCollection(name, selectedCollectionIcon);
    if (success) {
        showMessage(`✅ Collection "${name}" créée !`, 'success');
        closeCreateCollectionModal();
        renderCollectionsGrid();
        renderModalCollections();
    }
}

function deleteCollection(collectionId) {
    const collection = libraryCollections.find(c => c.id === collectionId);
    if (!collection) return;
    
    if (!confirm(`Supprimer la collection "${collection.name}" ?`)) return;
    
    // Remove collection from all books
    books.forEach(book => {
        if (book.collections) {
            book.collections = book.collections.filter(c => c !== collection.name);
        }
    });
    saveBooks();
    
    // Remove collection from library
    libraryCollections = libraryCollections.filter(c => c.id !== collectionId);
    saveCollections();
    
    showMessage(`🗑️ Collection "${collection.name}" supprimée`, 'info');
    renderCollectionsGrid();
}

function openCollectionView(collectionName) {
    // Navigate to library first
    navigateTo('library');
    
    // Apply collection filter after navigation
    setTimeout(() => {
        activeFilters.collection = collectionName;
        updateDropdownLabel('collections', collectionName);
        populateCollectionsFilter();
        applyFilters();
    }, 100);
}

function clearCollectionFilter() {
    clearAllFilters();
}

// ==========================================
// SYSTÈME DE FILTRAGE AVANCÉ
// ==========================================

function applyFilters() {
    let result = [...books];
    
    // Filtre par statut
    if (activeFilters.status) {
        result = result.filter(b => b.status === activeFilters.status);
    }
    
    // Filtre par genre
    if (activeFilters.genre) {
        result = result.filter(b => b.genres && b.genres.includes(activeFilters.genre));
    }
    
    // Filtre par collection
    if (activeFilters.collection) {
        result = result.filter(b => b.collections && b.collections.includes(activeFilters.collection));
    }
    
    // Filtre par tag
    if (activeFilters.tag) {
        const tagQuery = activeFilters.tag.toLowerCase();
        result = result.filter(b => b.tags && b.tags.some(t => t.toLowerCase().includes(tagQuery)));
    }
    
    // Filtre par recherche textuelle
    if (activeFilters.search) {
        const query = activeFilters.search.toLowerCase();
        result = result.filter(b => 
            b.title.toLowerCase().includes(query) || 
            b.author.toLowerCase().includes(query)
        );
    }
    
    filteredBooks = result;
    displayBooks();
    updateActiveFilterBanner();
}

function updateActiveFilterBanner() {
    const banner = document.getElementById('activeFilterBanner');
    const filterIcon = document.getElementById('activeFilterIcon');
    const filterName = document.getElementById('activeFilterName');
    const filterCount = document.getElementById('activeFilterCount');
    
    if (!banner) return;
    
    // Construire le texte des filtres actifs
    const activeFilterTexts = [];
    let mainIcon = '🔍';
    
    if (activeFilters.collection) {
        const col = libraryCollections.find(c => c.name === activeFilters.collection);
        mainIcon = col ? col.icon : '📚';
        activeFilterTexts.push(activeFilters.collection);
    }
    if (activeFilters.genre) {
        if (activeFilterTexts.length === 0) mainIcon = '📖';
        activeFilterTexts.push(activeFilters.genre);
    }
    if (activeFilters.tag) {
        if (activeFilterTexts.length === 0) mainIcon = '🏷️';
        activeFilterTexts.push(`#${activeFilters.tag}`);
    }
    if (activeFilters.status) {
        const statusLabels = { 'to-read': 'À lire', 'reading': 'En cours', 'read': 'Lus' };
        if (activeFilterTexts.length === 0) mainIcon = '📊';
        activeFilterTexts.push(statusLabels[activeFilters.status]);
    }
    
    if (activeFilterTexts.length > 0) {
        banner.style.display = 'flex';
        if (filterIcon) filterIcon.textContent = mainIcon;
        if (filterName) filterName.textContent = activeFilterTexts.join(' • ');
        if (filterCount) filterCount.textContent = `${filteredBooks.length} livre${filteredBooks.length > 1 ? 's' : ''}`;
    } else {
        banner.style.display = 'none';
    }
    
    // Mettre à jour le compteur principal aussi
    const libraryCount = document.getElementById('libraryCount');
    if (libraryCount) {
        if (activeFilterTexts.length > 0) {
            libraryCount.textContent = `${filteredBooks.length} livre${filteredBooks.length > 1 ? 's' : ''} (filtré)`;
        } else {
            libraryCount.textContent = `${books.length} livre${books.length > 1 ? 's' : ''}`;
        }
    }
}

function clearActiveFilter() {
    clearAllFilters();
}

function clearAllFilters() {
    activeFilters = {
        status: '',
        genre: '',
        collection: '',
        tag: '',
        search: ''
    };
    
    // Reset UI controls
    const searchBooks = document.getElementById('searchBooks');
    const statusChips = document.querySelectorAll('.status-chip');
    
    if (searchBooks) searchBooks.value = '';
    
    statusChips.forEach(chip => {
        if (chip.dataset.status === '') {
            chip.classList.add('active');
        } else {
            chip.classList.remove('active');
        }
    });
    
    // Reset dropdown labels
    updateDropdownLabel('collections', 'Collections');
    updateDropdownLabel('genres', 'Genres');
    updateDropdownLabel('tags', 'Tags');
    
    // Refresh filter lists
    populateCollectionsFilter();
    populateGenresFilter();
    populateTagsFilter();
    
    filteredBooks = [...books];
    displayBooks();
    updateActiveFilterBanner();
}

function initAdvancedFilters() {
    // Initialiser les dropdowns de filtres
    initFilterDropdown('collections');
    initFilterDropdown('genres');
    initFilterDropdown('tags');
    
    // Remplir les listes
    populateCollectionsFilter();
    populateGenresFilter();
    populateTagsFilter();
    
    // Fermer les dropdowns quand on clique ailleurs
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.filter-dropdown')) {
            document.querySelectorAll('.filter-dropdown-menu').forEach(menu => {
                menu.classList.remove('open');
            });
        }
    });
}

function initFilterDropdown(type) {
    const btn = document.getElementById(`${type}FilterBtn`);
    const menu = document.getElementById(`${type}FilterMenu`);
    
    if (btn && menu) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Fermer les autres menus
            document.querySelectorAll('.filter-dropdown-menu').forEach(m => {
                if (m !== menu) m.classList.remove('open');
            });
            menu.classList.toggle('open');
        });
    }
}

function populateCollectionsFilter() {
    const list = document.getElementById('collectionsFilterList');
    if (!list) return;
    
    list.innerHTML = `
        <div class="filter-option ${!activeFilters.collection ? 'active' : ''}" 
             onclick="setCollectionFilter('')">
            Toutes les collections
        </div>
    `;
    
    libraryCollections.forEach(col => {
        const isActive = activeFilters.collection === col.name;
        list.innerHTML += `
            <div class="filter-option ${isActive ? 'active' : ''}" 
                 onclick="setCollectionFilter('${col.name}')">
                ${col.icon} ${col.name}
            </div>
        `;
    });
}

function setCollectionFilter(collectionName) {
    activeFilters.collection = collectionName;
    populateCollectionsFilter();
    closeFilterMenus();
    updateDropdownLabel('collections', collectionName || 'Collections');
    applyFilters();
}

function populateGenresFilter() {
    const list = document.getElementById('genresFilterList');
    if (!list) return;
    
    list.innerHTML = `
        <div class="filter-option ${!activeFilters.genre ? 'active' : ''}" 
             onclick="setGenreFilter('')">
            Tous les genres
        </div>
    `;
    
    libraryGenres.forEach(genre => {
        const isActive = activeFilters.genre === genre;
        list.innerHTML += `
            <div class="filter-option ${isActive ? 'active' : ''}" 
                 onclick="setGenreFilter('${genre}')">
                ${genre}
            </div>
        `;
    });
}

function setGenreFilter(genre) {
    activeFilters.genre = genre;
    populateGenresFilter();
    closeFilterMenus();
    updateDropdownLabel('genres', genre || 'Genres');
    applyFilters();
}

function populateTagsFilter() {
    const list = document.getElementById('tagsFilterList');
    if (!list) return;
    
    // Collecter tous les tags uniques des livres
    const allTags = new Set();
    books.forEach(book => {
        if (book.tags) {
            book.tags.forEach(tag => allTags.add(tag));
        }
    });
    
    list.innerHTML = `
        <div class="filter-option ${!activeFilters.tag ? 'active' : ''}" 
             onclick="setTagFilter('')">
            Tous les tags
        </div>
    `;
    
    Array.from(allTags).sort().forEach(tag => {
        const isActive = activeFilters.tag === tag;
        list.innerHTML += `
            <div class="filter-option ${isActive ? 'active' : ''}" 
                 onclick="setTagFilter('${tag}')">
                #${tag}
            </div>
        `;
    });
    
    if (allTags.size === 0) {
        list.innerHTML += `
            <div class="filter-option disabled">
                <em>Aucun tag défini</em>
            </div>
        `;
    }
}

function setTagFilter(tag) {
    activeFilters.tag = tag;
    populateTagsFilter();
    closeFilterMenus();
    updateDropdownLabel('tags', tag ? `#${tag}` : 'Tags');
    applyFilters();
}

function updateDropdownLabel(type, label) {
    const btn = document.getElementById(`${type}FilterBtn`);
    if (btn) {
        const labelSpan = btn.querySelector('.dropdown-label');
        if (labelSpan) {
            labelSpan.textContent = label;
        }
    }
}

function closeFilterMenus() {
    document.querySelectorAll('.filter-dropdown-menu').forEach(menu => {
        menu.classList.remove('open');
    });
}

function updateCollectionFilter() {
    populateCollectionsFilter();
}

function initCollections() {
    // Add collection button
    const addBtn = document.getElementById('addCollectionBtn');
    if (addBtn) {
        addBtn.addEventListener('click', openCreateCollectionModal);
    }
    
    // Create collection modal buttons
    const cancelBtn = document.getElementById('cancelCollectionBtn');
    const confirmBtn = document.getElementById('confirmCollectionBtn');
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeCreateCollectionModal);
    }
    if (confirmBtn) {
        confirmBtn.addEventListener('click', createNewCollection);
    }
    
    // Icon selection
    const modal = document.getElementById('createCollectionModal');
    if (modal) {
        const iconBtns = modal.querySelectorAll('.collection-icon-btn');
        iconBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                iconBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedCollectionIcon = btn.dataset.icon;
            });
        });
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeCreateCollectionModal();
            }
        });
    }
    
    // Enter key to create
    const nameInput = document.getElementById('newCollectionName');
    if (nameInput) {
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                createNewCollection();
            }
        });
    }
    
    // Initial render - utilise setTimeout pour s'assurer que loadBooks() a déjà chargé les collections
    setTimeout(() => {
        renderCollectionsGrid();
    }, 50);
}

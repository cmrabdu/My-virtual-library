// Gestion de l'interface utilisateur et des interactions

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
        addedDate: new Date().toLocaleDateString('fr-FR')
    };

    books.push(newBook);
    filteredBooks = [...books];
    saveBooks();
    
    // Reset complet
    event.target.reset();
    resetRating();
    CONFIG.tempCoverUrl = null;
    
    // Mettre à jour toutes les vues
    updateStats();
    updateHomePage();
    displayBooks();
    
    showMessage('✅ Livre ajouté avec succès !', 'success');
    
    // Navigation douce vers l'accueil
    setTimeout(() => navigateTo('home'), 800);
}

function displayBooks() {
    const container = document.getElementById('booksList');
    const loading = document.getElementById('loadingBooks');
    const emptyState = document.getElementById('emptyState');

    if (!container) return;
    container.innerHTML = '';
    if (loading) loading.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';

    if (filteredBooks.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    filteredBooks.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';
        bookCard.innerHTML = `
            <div class="book-cover-wrapper">
                <img src="${book.cover}" alt="${book.title}" class="book-cover" onerror="this.src='https://via.placeholder.com/128x192?text=Livre'">
                ${book.rating > 0 ? `<div class="book-rating-badge">${'★'.repeat(book.rating)}</div>` : ''}
            </div>
            <div class="book-info">
                <h3>${book.title}</h3>
                <p class="book-author">${book.author}</p>
                ${book.isbn ? `<p class="book-isbn">ISBN: ${book.isbn}</p>` : ''}
                <div class="book-status">
                    <span class="status-badge status-${book.status}" onclick="editBookStatus(${book.id})">${getStatusLabel(book.status)}</span>
                </div>
                <div class="book-rating">
                    <div class="stars" onclick="editBookRating(${book.id})">
                        ${renderStars(book.rating)}
                    </div>
                </div>
                <div class="book-actions">
                    <button class="view-btn" onclick="viewBookDetails(${book.id})">👁️ Détails</button>
                    <button class="delete-btn" onclick="deleteBook(${book.id})">🗑️</button>
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
            searchBtn.textContent = '🔍 Rechercher par ISBN';
        });
    }

    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) {
        filterStatus.addEventListener('change', (e) => {
            const status = e.target.value;
            filteredBooks = status ? books.filter(b => b.status === status) : [...books];
            displayBooks();
        });
    }

    const searchBooks = document.getElementById('searchBooks');
    if (searchBooks) {
        searchBooks.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            filteredBooks = books.filter(b => 
                b.title.toLowerCase().includes(query) || 
                b.author.toLowerCase().includes(query)
            );
            displayBooks();
        });
    }

    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportLibrary);
    }

    const starsContainer = document.getElementById('starRating');
    setupStarRating(starsContainer);
}

function showMessage(message, type = 'info') {
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.textContent = message;
    messageEl.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 16px 24px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000; font-weight: 500; max-width: 400px;
    `;
    document.body.appendChild(messageEl);
    setTimeout(() => messageEl.remove(), 3000);
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
    showMessage(`⭐ Note: ${rating}/5`, 'success');
}

function viewBookDetails(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    const details = `
📖 ${book.title}
✍️ ${book.author}
${book.isbn ? `📌 ISBN: ${book.isbn}` : ''}
${book.pages ? `📄 Pages: ${book.pages}` : ''}
📊 ${getStatusLabel(book.status)}
⭐ ${book.rating > 0 ? book.rating + '/5' : 'Non noté'}
📅 Ajouté le ${book.addedDate}
${book.summary ? `\n📝 Résumé:\n${book.summary}` : ''}
${book.learnings ? `\n💡 Apprentissages:\n${book.learnings}` : ''}
    `.trim();

    alert(details);
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

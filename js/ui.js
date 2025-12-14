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
        currentPage: 0,
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
            filteredBooks = status ? books.filter(b => b.status === status) : [...books];
            displayBooks();
        });
    });

    const searchBooks = document.getElementById('searchBooks');
    if (searchBooks) {
        searchBooks.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            
            // Récupérer le filtre actif
            const activeChip = document.querySelector('.status-chip.active');
            const activeStatus = activeChip ? activeChip.dataset.status : '';
            
            // Filtrer d'abord par statut si nécessaire
            let baseBooks = activeStatus ? books.filter(b => b.status === activeStatus) : [...books];
            
            // Puis filtrer par recherche
            filteredBooks = baseBooks.filter(b => 
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

function openBookModal(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    
    currentModalBookId = bookId;
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

function closeBookModal() {
    const modal = document.getElementById('bookModalOverlay');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
        document.body.style.overflow = '';
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

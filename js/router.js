// Gestion de la navigation entre les pages

let currentPage = 'home';

function navigateTo(pageName) {
    // Cacher toutes les pages
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });

    // Afficher la page demandée
    const targetPage = document.getElementById(`page-${pageName}`);
    if (targetPage) {
        targetPage.style.display = 'block';
        currentPage = pageName;
    }

    // Mettre à jour la navigation active
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeNav = document.querySelector(`[data-page="${pageName}"]`);
    if (activeNav) {
        activeNav.classList.add('active');
    }

    // Actions spécifiques par page
    switch(pageName) {
        case 'home':
            updateHomePage();
            break;
        case 'library':
            displayBooks();
            break;
        case 'search':
            // La page recherche est gérée séparément
            break;
        case 'profile':
            updateProfilePage();
            break;
    }

    // Sauvegarder la page actuelle
    localStorage.setItem('currentPage', pageName);
}

function updateHomePage() {
    // Livres en cours
    const readingBooks = books.filter(b => b.status === 'reading').slice(0, 3);
    const currentReadingList = document.getElementById('currentReadingList');
    
    if (currentReadingList) {
        if (readingBooks.length === 0) {
            currentReadingList.innerHTML = '<p style="text-align: center; color: #94a3b8; padding: 20px;">Aucun livre en cours</p>';
        } else {
            currentReadingList.innerHTML = '';
            readingBooks.forEach(book => {
                const card = createBookCard(book);
                currentReadingList.appendChild(card);
            });
        }
    }

    // Derniers ajouts
    const recentBooks = [...books].sort((a, b) => b.id - a.id).slice(0, 6);
    const recentBooksList = document.getElementById('recentBooksList');
    
    if (recentBooksList) {
        if (recentBooks.length === 0) {
            recentBooksList.innerHTML = '<p style="text-align: center; color: #94a3b8; padding: 20px;">Aucun livre ajouté</p>';
        } else {
            recentBooksList.innerHTML = '';
            recentBooks.forEach(book => {
                const card = createBookCard(book);
                recentBooksList.appendChild(card);
            });
        }
    }
}

function updateProfilePage() {
    // Nom utilisateur
    const userName = localStorage.getItem('userName') || 'Lecteur';
    const userNameEl = document.getElementById('userName');
    const userNameInput = document.getElementById('userNameInput');
    if (userNameEl) userNameEl.textContent = userName;
    if (userNameInput) userNameInput.value = userName;

    // Objectif annuel
    const yearlyGoal = parseInt(localStorage.getItem('yearlyGoal') || '24');
    const yearlyGoalInput = document.getElementById('yearlyGoal');
    if (yearlyGoalInput) yearlyGoalInput.value = yearlyGoal;

    // Stats profil
    const totalBooks = books.length;
    const readBooks = books.filter(b => b.status === 'read').length;
    const totalPages = books.reduce((sum, b) => sum + (parseInt(b.pages) || 0), 0);

    const profileTotalBooks = document.getElementById('profileTotalBooks');
    const profileReadBooks = document.getElementById('profileReadBooks');
    const profilePages = document.getElementById('profilePages');

    if (profileTotalBooks) profileTotalBooks.textContent = totalBooks;
    if (profileReadBooks) profileReadBooks.textContent = readBooks;
    if (profilePages) profilePages.textContent = totalPages;
}

function createBookCard(book) {
    const card = document.createElement('div');
    card.className = 'book-card';
    card.innerHTML = `
        <div class="book-cover-wrapper">
            <img src="${book.cover}" alt="${book.title}" class="book-cover" onerror="this.src='https://via.placeholder.com/128x192?text=Livre'">
            ${book.rating > 0 ? `<div class="book-rating-badge">${'★'.repeat(book.rating)}</div>` : ''}
        </div>
        <div class="book-info">
            <h3>${book.title}</h3>
            <p class="book-author">${book.author}</p>
            ${book.isbn ? `<p class="book-isbn">ISBN: ${book.isbn}</p>` : ''}
            <div class="book-status" style="cursor: pointer;" onclick="editBookStatus(${book.id})" title="Cliquer pour changer le statut">
                <span class="status-badge status-${book.status}">${getStatusLabel(book.status)}</span>
            </div>
            <div class="book-rating" style="margin: 8px 0;">
                <div class="stars interactive-stars" data-book-id="${book.id}">
                    ${renderInteractiveStars(book.rating, book.id)}
                </div>
                ${book.rating > 0 ? `<small style="color: #64748b;">${book.rating}/5</small>` : '<small style="color: #94a3b8;">Cliquer sur une étoile</small>'}
            </div>
            ${book.pages ? renderProgressBar(book) : ''}
        </div>
    `;
    return card;
}

function initRouter() {
    // Restaurer la dernière page visitée
    const lastPage = localStorage.getItem('currentPage') || 'home';
    navigateTo(lastPage);

    // Écouter les clics sur la navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            if (page) {
                navigateTo(page);
            }
        });
    });

    // Boutons de sauvegarde du profil
    const saveSettings = document.getElementById('saveSettings');
    if (saveSettings) {
        saveSettings.addEventListener('click', () => {
            const userName = document.getElementById('userNameInput').value.trim();
            const yearlyGoal = document.getElementById('yearlyGoal').value;

            if (userName) localStorage.setItem('userName', userName);
            localStorage.setItem('yearlyGoal', yearlyGoal);

            updateProfilePage();
            showMessage('✅ Paramètres sauvegardés !', 'success');
        });
    }

    // Import de bibliothèque
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile');
    
    if (importBtn && importFile) {
        importBtn.addEventListener('click', () => importFile.click());
        
        importFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const importedBooks = JSON.parse(event.target.result);
                        if (Array.isArray(importedBooks)) {
                            books = importedBooks;
                            filteredBooks = [...books];
                            saveBooks();
                            updateStats();
                            displayBooks();
                            showMessage(`✅ ${importedBooks.length} livres importés !`, 'success');
                        }
                    } catch (error) {
                        showMessage('❌ Erreur lors de l\'import', 'error');
                    }
                };
                reader.readAsText(file);
            }
        });
    }

    // Réinitialisation
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('⚠️ Êtes-vous sûr de vouloir supprimer TOUTES vos données ?')) {
                localStorage.clear();
                books = [];
                filteredBooks = [];
                saveBooks();
                updateStats();
                displayBooks();
                showMessage('🗑️ Données réinitialisées', 'info');
                navigateTo('home');
            }
        });
    }

    // Gestion des sous-onglets du profil
    const profileTabs = document.querySelectorAll('.profile-tab');
    profileTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Mettre à jour les onglets actifs
            profileTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Afficher le bon contenu
            document.querySelectorAll('.profile-tab-content').forEach(content => {
                content.style.display = 'none';
            });
            const targetContent = document.getElementById(`tab-${targetTab}`);
            if (targetContent) {
                targetContent.style.display = 'block';
                
                // Si on ouvre l'onglet stats, mettre à jour les graphiques
                if (targetTab === 'stats') {
                    updateStats();
                    updateCharts();
                }
            }
        });
    });

    // Initialiser la page de recherche
    initSearchPage();
}

function initSearchPage() {
    const globalSearchBtn = document.getElementById('globalSearchBtn');
    const globalSearchInput = document.getElementById('globalSearchInput');
    
    if (globalSearchBtn && globalSearchInput) {
        globalSearchBtn.addEventListener('click', () => performGlobalSearch());
        globalSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performGlobalSearch();
        });
    }

    // Gestion des filtres de recherche
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
        });
    });
}

function quickSearch(query) {
    const searchInput = document.getElementById('globalSearchInput');
    if (searchInput) {
        searchInput.value = query;
        performGlobalSearch();
    }
}

function performGlobalSearch() {
    const query = document.getElementById('globalSearchInput').value.trim();
    const activeFilter = document.querySelector('.filter-chip.active')?.dataset.filter || 'all';
    const resultsContainer = document.getElementById('searchResults');
    
    if (!query) {
        showMessage('⚠️ Entrez un terme de recherche', 'warning');
        return;
    }

    resultsContainer.innerHTML = '<div class="loading"><div class="spinner"></div>Recherche en cours...</div>';

    // Recherche via Google Books API
    searchGoogleBooks(query)
        .then(results => {
            displaySearchResults(results, resultsContainer);
        })
        .catch(error => {
            resultsContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #64748b;">
                    <p>❌ Erreur lors de la recherche</p>
                    <p style="font-size: 14px;">${error.message}</p>
                </div>
            `;
        });
}

function displaySearchResults(results, container) {
    if (!results || results.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #64748b;">
                <p>📭 Aucun résultat trouvé</p>
                <p style="font-size: 14px;">Essayez avec d'autres mots-clés</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '<div class="search-results-grid"></div>';
    const grid = container.querySelector('.search-results-grid');

    results.slice(0, 12).forEach(book => {
        const resultCard = document.createElement('div');
        resultCard.className = 'search-result-card';
        resultCard.innerHTML = `
            <img src="${book.cover}" alt="${book.title}" class="search-result-cover">
            <div class="search-result-info">
                <h4>${book.title}</h4>
                <p class="search-result-author">${book.author}</p>
                ${book.pages ? `<p class="search-result-pages">${book.pages} pages</p>` : ''}
                <button class="btn btn-small btn-primary" onclick="addBookFromSearch('${book.isbn || ''}', '${book.title.replace(/'/g, "\\'")}', '${book.author.replace(/'/g, "\\'")}', '${book.pages || ''}', '${book.cover}')">
                    ➕ Ajouter
                </button>
            </div>
        `;
        grid.appendChild(resultCard);
    });
}

function addBookFromSearch(isbn, title, author, pages, cover) {
    // Pré-remplir le formulaire et basculer sur la page d'ajout
    CONFIG.tempCoverUrl = cover;
    navigateTo('add');
    
    setTimeout(() => {
        document.getElementById('isbn').value = isbn;
        document.getElementById('title').value = title;
        document.getElementById('author').value = author;
        document.getElementById('pages').value = pages;
        showMessage('📝 Formulaire pré-rempli, complétez et ajoutez !', 'info');
    }, 100);
}

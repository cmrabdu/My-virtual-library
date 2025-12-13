// Fonctions de visualisation des statistiques

function updateStatsPage() {
    updateHeroStats();
    updateGoalProgress();
    updateStatusBars();
    updateRecords();
    updateRatingDistribution();
    updateActivityChart();
}

function updateHeroStats() {
    // Total livres
    const totalBooksEl = document.getElementById('statTotalBooks');
    if (totalBooksEl) totalBooksEl.textContent = books.length;
    
    // Total pages lues (livres lus uniquement)
    const totalPagesEl = document.getElementById('statTotalPages');
    if (totalPagesEl) {
        const readBooks = books.filter(b => b.status === 'read');
        const totalPages = readBooks.reduce((sum, book) => {
            const pages = parseInt(book.pages) || 0;
            return sum + pages;
        }, 0);
        totalPagesEl.textContent = totalPages.toLocaleString('fr-FR');
    }
    
    // Note moyenne
    const avgRatingEl = document.getElementById('statAvgRating');
    if (avgRatingEl) {
        const ratedBooks = books.filter(b => b.rating > 0);
        if (ratedBooks.length > 0) {
            const avg = ratedBooks.reduce((sum, b) => sum + b.rating, 0) / ratedBooks.length;
            avgRatingEl.textContent = avg.toFixed(1) + '★';
        } else {
            avgRatingEl.textContent = '-';
        }
    }
}

function updateGoalProgress() {
    const currentYear = new Date().getFullYear();
    const yearEl = document.getElementById('currentYear');
    if (yearEl) yearEl.textContent = currentYear;
    
    const booksThisYear = books.filter(book => {
        const parts = book.addedDate?.split('/');
        if (parts && parts.length === 3) {
            return parseInt(parts[2]) === currentYear;
        }
        return false;
    }).length;
    
    const target = parseInt(localStorage.getItem('yearlyGoal') || '24');
    const percentage = Math.min((booksThisYear / target) * 100, 100);
    
    const fillEl = document.getElementById('goalProgressFill');
    const currentEl = document.getElementById('goalCurrent');
    const targetEl = document.getElementById('goalTarget');
    const motivationEl = document.getElementById('goalMotivation');
    
    if (fillEl) fillEl.style.width = `${percentage}%`;
    if (currentEl) currentEl.textContent = booksThisYear;
    if (targetEl) targetEl.textContent = `/ ${target} livres`;
    
    if (motivationEl) {
        const remaining = target - booksThisYear;
        let emoji = '🚀';
        let text = 'Commencez votre aventure littéraire !';
        
        if (booksThisYear === 0) {
            emoji = '📚';
            text = 'Ajoutez votre premier livre de l\'année !';
        } else if (percentage >= 100) {
            emoji = '🏆';
            text = 'Objectif atteint ! Félicitations !';
        } else if (percentage >= 75) {
            emoji = '🔥';
            text = `Plus que ${remaining} livre${remaining > 1 ? 's' : ''} !`;
        } else if (percentage >= 50) {
            emoji = '💪';
            text = 'Vous êtes à mi-chemin, continuez !';
        } else if (percentage >= 25) {
            emoji = '📖';
            text = `${remaining} livres restants, vous pouvez le faire !`;
        } else {
            emoji = '🌟';
            text = `Bon début ! Encore ${remaining} livres à découvrir.`;
        }
        
        motivationEl.innerHTML = `
            <span class="motivation-emoji">${emoji}</span>
            <span class="motivation-text">${text}</span>
        `;
    }
}

function updateStatusBars() {
    const total = books.length || 1;
    const readCount = books.filter(b => b.status === 'read').length;
    const readingCount = books.filter(b => b.status === 'reading').length;
    const toReadCount = books.filter(b => b.status === 'to-read').length;
    
    // Counts
    const readCountEl = document.getElementById('barReadCount');
    const readingCountEl = document.getElementById('barReadingCount');
    const toReadCountEl = document.getElementById('barToReadCount');
    
    if (readCountEl) readCountEl.textContent = readCount;
    if (readingCountEl) readingCountEl.textContent = readingCount;
    if (toReadCountEl) toReadCountEl.textContent = toReadCount;
    
    // Fills
    const readFillEl = document.getElementById('barReadFill');
    const readingFillEl = document.getElementById('barReadingFill');
    const toReadFillEl = document.getElementById('barToReadFill');
    
    if (readFillEl) readFillEl.style.width = `${(readCount / total) * 100}%`;
    if (readingFillEl) readingFillEl.style.width = `${(readingCount / total) * 100}%`;
    if (toReadFillEl) toReadFillEl.style.width = `${(toReadCount / total) * 100}%`;
}

function updateRecords() {
    // Livre le plus long
    const longestBookEl = document.getElementById('recordLongestBook');
    if (longestBookEl) {
        const booksWithPages = books.filter(b => parseInt(b.pages) > 0);
        if (booksWithPages.length > 0) {
            const longest = booksWithPages.reduce((max, b) => 
                parseInt(b.pages) > parseInt(max.pages) ? b : max
            );
            longestBookEl.textContent = `${longest.pages} p.`;
        } else {
            longestBookEl.textContent = '-';
        }
    }
    
    // Meilleur mois
    const bestMonthEl = document.getElementById('recordBestMonth');
    if (bestMonthEl) {
        const monthCounts = {};
        books.forEach(book => {
            const parts = book.addedDate?.split('/');
            if (parts && parts.length === 3) {
                const key = `${parts[1]}/${parts[2]}`;
                monthCounts[key] = (monthCounts[key] || 0) + 1;
            }
        });
        
        const entries = Object.entries(monthCounts);
        if (entries.length > 0) {
            const best = entries.reduce((max, [k, v]) => v > max[1] ? [k, v] : max);
            const months = ['', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
            const [m, y] = best[0].split('/');
            bestMonthEl.textContent = `${months[parseInt(m)]} ${y} (${best[1]})`;
        } else {
            bestMonthEl.textContent = '-';
        }
    }
    
    // Livres 5 étoiles
    const topRatedEl = document.getElementById('recordTopRated');
    if (topRatedEl) {
        const fiveStars = books.filter(b => b.rating === 5).length;
        topRatedEl.textContent = fiveStars > 0 ? `${fiveStars} livre${fiveStars > 1 ? 's' : ''}` : '-';
    }
    
    // Auteur favori
    const favAuthorEl = document.getElementById('recordFavAuthor');
    if (favAuthorEl) {
        const authorCounts = {};
        books.forEach(book => {
            if (book.author) {
                authorCounts[book.author] = (authorCounts[book.author] || 0) + 1;
            }
        });
        
        const entries = Object.entries(authorCounts);
        if (entries.length > 0) {
            const fav = entries.reduce((max, [k, v]) => v > max[1] ? [k, v] : max);
            if (fav[1] > 1) {
                favAuthorEl.textContent = fav[0].length > 15 ? fav[0].substring(0, 15) + '...' : fav[0];
            } else {
                favAuthorEl.textContent = '-';
            }
        } else {
            favAuthorEl.textContent = '-';
        }
    }
}

function updateRatingDistribution() {
    const ratingCounts = [0, 0, 0, 0, 0];
    books.forEach(book => {
        if (book.rating >= 1 && book.rating <= 5) {
            ratingCounts[book.rating - 1]++;
        }
    });
    
    const maxCount = Math.max(...ratingCounts) || 1;
    
    for (let i = 5; i >= 1; i--) {
        const countEl = document.getElementById(`rating${i}Count`);
        const fillEl = document.getElementById(`rating${i}Fill`);
        const count = ratingCounts[i - 1];
        
        if (countEl) countEl.textContent = count;
        if (fillEl) fillEl.style.width = `${(count / maxCount) * 100}%`;
    }
}

function updateActivityChart() {
    const chartEl = document.getElementById('activityChart');
    if (!chartEl) return;
    
    // Calculer les 6 derniers mois
    const monthlyData = {};
    const now = new Date();
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const label = monthNames[date.getMonth()];
        monthlyData[key] = { count: 0, label };
    }
    
    books.forEach(book => {
        const parts = book.addedDate?.split('/');
        if (parts && parts.length === 3) {
            const key = `${parts[2]}-${parts[1]}`;
            if (monthlyData[key]) {
                monthlyData[key].count++;
            }
        }
    });
    
    const values = Object.values(monthlyData);
    const maxCount = Math.max(...values.map(v => v.count)) || 1;
    
    chartEl.innerHTML = values.map(v => `
        <div class="activity-bar">
            <div class="activity-bar-fill" style="height: ${Math.max((v.count / maxCount) * 100, 4)}px"></div>
            <span class="activity-bar-label">${v.label}</span>
        </div>
    `).join('');
}

// Garder la compatibilité avec l'ancien code
function updateCharts() {
    updateStatsPage();
}

function drawStatusChart() { }
function drawRatingChart() { }
function drawEvolutionChart() { }
function updateYearlyProgress() {
    updateGoalProgress();
}

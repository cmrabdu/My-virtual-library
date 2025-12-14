// Point d'entrée de l'application

document.addEventListener('DOMContentLoaded', () => {
    loadBooks();
    bindEvents();
    initRouter();
    updateStats();
    
    // Rendre les collections après le chargement des données
    setTimeout(() => {
        if (typeof renderCollectionsGrid === 'function') {
            renderCollectionsGrid();
        }
    }, 100);
});
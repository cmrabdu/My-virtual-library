// Point d'entrée de l'application

document.addEventListener('DOMContentLoaded', () => {
    loadBooks();
    bindEvents();
    initRouter();
    updateStats();
});
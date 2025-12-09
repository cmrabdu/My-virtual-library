// Gestion du localStorage
function loadBooks() {
    const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
    books = stored ? JSON.parse(stored) : [];
    filteredBooks = [...books];
}

function saveBooks() {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(books));
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
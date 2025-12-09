// Gestion des API externes

async function searchBookByISBN(isbn) {
    try {
        // Essayer Google Books d'abord
        const googleData = await searchGoogleBooks(isbn);
        if (googleData) return googleData;

        // Fallback vers OpenLibrary
        const openLibData = await searchOpenLibrary(isbn);
        return openLibData;
    } catch (error) {
        console.error('Erreur recherche ISBN:', error);
        return null;
    }
}

async function searchGoogleBooks(isbn) {
    try {
        const cleanIsbn = isbn.replace(/[-\s]/g, '');
        const response = await fetch(`${CONFIG.GOOGLE_BOOKS_API}?q=isbn:${cleanIsbn}`);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            const book = data.items[0].volumeInfo;
            
            // Essayer plusieurs sources pour la couverture
            let cover = book.imageLinks?.thumbnail?.replace('http:', 'https:') ||
                       book.imageLinks?.smallThumbnail?.replace('http:', 'https:') ||
                       `${CONFIG.OPENLIBRARY_COVERS}/${cleanIsbn}-M.jpg`;
            
            return {
                title: book.title || '',
                author: book.authors ? book.authors.join(', ') : '',
                cover: cover,
                summary: book.description || '',
                pages: book.pageCount || ''
            };
        }
        return null;
    } catch (error) {
        console.error('Erreur OpenLibrary:', error);
        return null;
    }
}

async function searchBooksByQuery(query, maxResults = 40) {
    try {
        const response = await fetch(`${CONFIG.GOOGLE_BOOKS_API}?q=${encodeURIComponent(query)}&maxResults=${maxResults}`);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            return data.items.map(item => {
                const book = item.volumeInfo;
                const isbn = book.industryIdentifiers?.[0]?.identifier || '';
                
                let cover = book.imageLinks?.thumbnail?.replace('http:', 'https:') ||
                           book.imageLinks?.smallThumbnail?.replace('http:', 'https:') ||
                           'https://via.placeholder.com/128x192?text=Livre';
                
                return {
                    isbn: isbn,
                    title: book.title || 'Titre inconnu',
                    author: book.authors ? book.authors.join(', ') : 'Auteur inconnu',
                    cover: cover,
                    summary: book.description || '',
                    pages: book.pageCount || ''
                };
            });
        }
        return [];
    } catch (error) {
        console.error('Erreur recherche par query:', error);
        return [];
    }
}

async function searchBooksByQueryPaginated(query, startIndex = 0) {
    try {
        const maxResults = 40;
        const response = await fetch(`${CONFIG.GOOGLE_BOOKS_API}?q=${encodeURIComponent(query)}&maxResults=${maxResults}&startIndex=${startIndex}`);
        const data = await response.json();

        const books = [];
        if (data.items && data.items.length > 0) {
            data.items.forEach(item => {
                const book = item.volumeInfo;
                const isbn = book.industryIdentifiers?.[0]?.identifier || '';
                
                let cover = book.imageLinks?.thumbnail?.replace('http:', 'https:') ||
                           book.imageLinks?.smallThumbnail?.replace('http:', 'https:') ||
                           'https://via.placeholder.com/128x192?text=Livre';
                
                books.push({
                    isbn: isbn,
                    title: book.title || 'Titre inconnu',
                    author: book.authors ? book.authors.join(', ') : 'Auteur inconnu',
                    cover: cover,
                    summary: book.description || '',
                    pages: book.pageCount || ''
                });
            });
        }
        
        return {
            books: books,
            totalItems: data.totalItems || 0,
            hasMore: (startIndex + books.length) < (data.totalItems || 0)
        };
    } catch (error) {
        console.error('Erreur recherche paginée:', error);
        return { books: [], totalItems: 0, hasMore: false };
    }
}

async function searchOpenLibrary(isbn) {
    try {
        const cleanIsbn = isbn.replace(/[-\s]/g, '');
        const response = await fetch(`${CONFIG.OPENLIBRARY_API}?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`);
        const data = await response.json();
        const key = `ISBN:${cleanIsbn}`;

        if (data[key]) {
            const book = data[key];
            
            // Essayer plusieurs tailles de couverture
            let cover = book.cover?.large || 
                       book.cover?.medium || 
                       book.cover?.small ||
                       `${CONFIG.OPENLIBRARY_COVERS}/${cleanIsbn}-L.jpg`;
            
            return {
                title: book.title || '',
                author: book.authors ? book.authors.map(a => a.name).join(', ') : '',
                cover: cover,
                summary: book.notes || book.subtitle || '',
                pages: book.number_of_pages || ''
            };
        }
        return null;
    } catch (error) {
        console.error('Erreur OpenLibrary:', error);
        return null;
    }
}
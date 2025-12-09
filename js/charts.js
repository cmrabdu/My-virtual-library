// Fonctions de visualisation des graphiques

function drawStatusChart() {
    const canvas = document.getElementById('statusChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;

    const toRead = books.filter(b => b.status === 'to-read').length;
    const reading = books.filter(b => b.status === 'reading').length;
    const read = books.filter(b => b.status === 'read').length;
    const total = books.length;

    if (total === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 20, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('📚', centerX, centerY - 10);
        ctx.font = '12px Arial';
        ctx.fillText('Aucun livre', centerX, centerY + 15);
        return;
    }

    const colors = ['#fbbf24', '#3b82f6', '#10b981'];
    const labels = ['À lire', 'En cours', 'Lus'];
    const values = [toRead, reading, read];

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let currentAngle = -Math.PI / 2;
    
    values.forEach((value, index) => {
        if (value > 0) {
            const sliceAngle = (value / total) * 2 * Math.PI;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = colors[index];
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.stroke();
            currentAngle += sliceAngle;
        }
    });
}

function drawRatingChart() {
    const canvas = document.getElementById('ratingChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const ratedBooks = books.filter(b => b.rating > 0);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (ratedBooks.length === 0) {
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(canvas.width/2 - 60, canvas.height/2 - 25, 120, 50);
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⭐', canvas.width / 2, canvas.height / 2 - 5);
        ctx.font = '11px Arial';
        ctx.fillText('Aucune note', canvas.width / 2, canvas.height / 2 + 12);
        return;
    }

    const ratingCounts = [0, 0, 0, 0, 0];
    ratedBooks.forEach(book => {
        if (book.rating >= 1 && book.rating <= 5) {
            ratingCounts[book.rating - 1]++;
        }
    });

    const maxCount = Math.max(...ratingCounts) || 1;
    const spacing = canvas.width / 6;
    const maxBarHeight = canvas.height - 80;

    ratingCounts.forEach((count, index) => {
        const x = spacing + index * spacing;
        const barHeight = count > 0 ? (count / maxCount) * maxBarHeight : 0;
        const y = canvas.height - 50 - barHeight;
        
        const gradient = ctx.createLinearGradient(x - 10, y, x + 10, canvas.height - 50);
        gradient.addColorStop(0, '#60a5fa');
        gradient.addColorStop(1, '#3b82f6');
        
        ctx.fillStyle = count > 0 ? gradient : '#e2e8f0';
        ctx.fillRect(x - 10, y, 20, barHeight);
    });
}

function drawEvolutionChart() {
    const canvas = document.getElementById('evolutionChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (books.length === 0) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(canvas.width/2 - 70, canvas.height/2 - 20, 140, 40);
        ctx.strokeStyle = '#e2e8f0';
        ctx.strokeRect(canvas.width/2 - 70, canvas.height/2 - 20, 140, 40);
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('📈', canvas.width / 2, canvas.height / 2 - 2);
        ctx.font = '11px Arial';
        ctx.fillText('Aucune donnée', canvas.width / 2, canvas.height / 2 + 12);
        return;
    }

    const monthlyData = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        monthlyData[key] = 0;
    }
    
    books.forEach(book => {
        const [day, month, year] = book.addedDate.split('/');
        const key = `${year}-${month}`;
        if (monthlyData.hasOwnProperty(key)) {
            monthlyData[key]++;
        }
    });

    const months = Object.keys(monthlyData);
    const values = Object.values(monthlyData);
    const maxValue = Math.max(...values) || 1;
    const chartArea = { left: 50, right: canvas.width - 30, top: 30, bottom: canvas.height - 50 };

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    values.forEach((value, index) => {
        const x = chartArea.left + (index * (chartArea.right - chartArea.left) / (months.length - 1));
        const y = chartArea.bottom - (value / maxValue * (chartArea.bottom - chartArea.top));
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
}

function updateYearlyProgress() {
    const currentYear = new Date().getFullYear();
    const booksThisYear = books.filter(book => {
        const bookYear = parseInt(book.addedDate.split('/')[2]);
        return bookYear === currentYear;
    }).length;

    const target = parseInt(localStorage.getItem('yearlyGoal') || '24');
    const percentage = Math.min((booksThisYear / target) * 100, 100);

    const progressBar = document.getElementById('yearlyProgress');
    const progressText = document.getElementById('progressText');
    
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }
    if (progressText) {
        progressText.textContent = `${booksThisYear} / ${target} livres`;
    }
}

function updateCharts() {
    drawStatusChart();
    drawRatingChart();
    drawEvolutionChart();
    updateYearlyProgress();
}

// History file
document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const tableBody = document.getElementById('history-table-body');

    function initTheme() {
        const savedTheme = localStorage.getItem('theme') ||
                          (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        body.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    }

    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i');
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    function toggleTheme() {
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    }

    function fetchHistory() {
        showLoader();

        fetch(`${baseUrl}/getHistory`, { 
            headers: { Authorization: Bearer `${token}` }
        })
            .then(response => response.json())
            .then(data => renderTable(data))
            .catch(err => {
                console.error(err);
                alert('Failed to load history.');
            })
            .finally(hideLoader);
    }

    function renderTable(history) {
        if (!history.length) {
            tableBody.innerHTML = <tr><td colspan="3" style="text-align:center;">No history records found.</td></tr>;
            return;
        }

        tableBody.innerHTML = history.map(record => `
            <tr data-id="${record.id}">
                <td><span class="method-badge ${record.method.toLowerCase()}">${record.method}</span></td>
                <td>${record.name}</td>
                <td>${record.url}</td>
            </tr>
        `).join('');

        setupTableRowClicks();  // Re-bind click after render
    }

    function setupTableRowClicks() {
        document.querySelectorAll('.history-table tbody tr').forEach(row => {
            row.addEventListener('click', function() {
                const requestId = this.getAttribute('data-id');
                window.location.href = `builder.html?id=${requestId}`;
            });
        });
    }

    function setupSearch() {
        const searchInput = document.getElementById('variable-search');
        const searchButton = document.querySelector('.search-container .btn');

        function performSearch() {
            const searchTerm = searchInput.value.toLowerCase();
            document.querySelectorAll('.history-table tbody tr').forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        }

        searchButton.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') performSearch();
        });
    }

    function setupMobileMenu() {
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const mainNav = document.querySelector('.main-nav');

        if (mobileMenuBtn && mainNav) {
            mobileMenuBtn.addEventListener('click', () => {
                const isVisible = mainNav.style.display === 'block';
                mainNav.style.display = isVisible ? 'none' : 'block';
                if (!isVisible) mainNav.style.animation = 'fadeIn 0.3s ease-in-out';
            });
        }
    }

    function showLoader() {
        document.getElementById('loader-overlay').style.display = 'flex';
    }

    function hideLoader() {
        document.getElementById('loader-overlay').style.display = 'none';
    }

    function init() {
        initTheme();
        themeToggle.addEventListener('click', toggleTheme);
        fetchHistory();
        setupSearch();
        setupMobileMenu();
    }

    init();
});
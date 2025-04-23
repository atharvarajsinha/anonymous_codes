document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        historyTableBody: document.getElementById('history-table-body'),
        searchInput: document.getElementById('variable-search'),
        themeToggle: document.getElementById('theme-toggle'),
        toggleBtn: document.getElementById('mobile-toggle'),
        mainNav: document.getElementById('main-nav'),
        logoutBtn: document.getElementById('logout-btn'),
        loaderOverlay: document.getElementById('loader-overlay')
    };

    for (const [key, element] of Object.entries(elements)) {
        if (!element) {
            console.error(`Element ${key} not found`);
            return;
        }
    }

    let allRequests = [];
    const baseUrl = BE_URL; 
    const token = localStorage.getItem('access_token');

    // Initialization
    function init() {
        fetchAllRequests();
        setupEventListeners();
        initTheme();
    }

    // Event Listeners Setup
    function setupEventListeners() {
        elements.searchInput.addEventListener('input', filterRequests);
        elements.toggleBtn.addEventListener('click', toggleMobileMenu);
        elements.logoutBtn.addEventListener('click', handleLogout);
        elements.themeToggle.addEventListener('click', toggleTheme);
        document.querySelector('.btn-primary').addEventListener('click', () => {
            filterRequests();
        });
    }

    function toggleMobileMenu() {
        elements.mainNav.classList.toggle('active');
        elements.toggleBtn.classList.toggle('active');
    }

    function initTheme() {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
        elements.themeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    function toggleTheme() {
        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
        document.documentElement.setAttribute('data-theme', isDarkMode ? 'light' : 'dark');
        localStorage.setItem('darkMode', !isDarkMode);
        elements.themeToggle.innerHTML = !isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    function handleLogout(e) {
        e.preventDefault();
        localStorage.clear();
        window.location.href = './index.html';
    }

    function fetchAllRequests() {
        showLoader();
        fetch(`${baseUrl}/requests/`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
            .then(handleResponse)
            .then(data => {
                allRequests = Array.isArray(data) ? data : [];
                renderRequests(allRequests);
            })
            .catch(showError)
            .finally(hideLoader);
    }

    function renderRequests(requests) {
        try {
            elements.historyTableBody.innerHTML = '';

            if (!requests || requests.length === 0) {
                elements.historyTableBody.innerHTML = `
                    <tr>
                        <td colspan="3" class="empty-message">No requests found in history</td>
                    </tr>
                `;
                return;
            }

            requests.forEach(request => {
                const row = document.createElement('tr');
                row.dataset.id = request.id;
                row.style.cursor = 'pointer';

                row.innerHTML = `
                    <td><span class="method-badge ${request.request_method.toLowerCase()}">${request.request_method}</span></td>
                    <td>${request.request_name || 'Unnamed Request'}</td>
                    <td class="url-cell">${request.request_url || ''}</td>
                `;

                row.addEventListener('click', () => {
                    window.location.href = `builder.html?id=${request.id}`;
                });

                elements.historyTableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error rendering requests:', error);
            showError({ message: 'Failed to display requests' });
        }
    }

    function filterRequests() {
        const searchTerm = elements.searchInput.value.toLowerCase();
        const filtered = allRequests.filter(request => {
            const name = request.request_name?.toLowerCase() || '';
            const url = request.request_url?.toLowerCase() || '';
            const method = request.request_method?.toLowerCase() || '';
            return name.includes(searchTerm) || url.includes(searchTerm) || method.includes(searchTerm);
        });
        renderRequests(filtered);
    }

    function handleResponse(response) {
        if (!response.ok) {
            return response.json().then(error => {
                throw error;
            });
        }
        return response.json();
    }

    function showError(error) {
        console.error("Error:", error);
        let errorMessage = "An error occurred while fetching requests.";
        
        if (error?.response?.status === 401) {
            alert("Session expired. Please login again.");
            window.location.href = "./index.html";
            return;
        }
        
        if (error.error) errorMessage = error.error;
        else if (error.message) errorMessage = error.message;

        try {
            elements.historyTableBody.innerHTML = `
                <tr>
                    <td colspan="3" class="error-message">${errorMessage}</td>
                </tr>
            `;
        } catch (e) {
            console.error('Failed to display error:', e);
            alert(errorMessage);
        }
    }

    function showLoader() {
        elements.loaderOverlay.style.display = 'flex';
    }

    function hideLoader() {
        elements.loaderOverlay.style.display = 'none';
    }

    // Initialize the application
    init();
});
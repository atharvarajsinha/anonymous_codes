document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const requestsTable = document.getElementById('requestsTable');
    const requestsTableBody = requestsTable.querySelector('tbody');
    const addRequestBtn = document.getElementById('addRequestBtn');
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const requestName = document.getElementById('requestName');
    const requestType = document.getElementById('requestType');
    const requestData = document.getElementById('requestData');
    const saveRequest = document.getElementById('saveRequest');
    const searchInput = document.getElementById('search');
    const emptyState = document.querySelector('.empty-state');
    const themeToggle = document.getElementById('theme-toggle');
    const toggleBtn = document.getElementById('mobile-toggle');
    const mainNav = document.getElementById('main-nav');
    const logoutBtn = document.getElementById('logout-btn');

    // Global Variables
    let allRequests = [];
    let currentEditId = null;
    const baseUrl = BE_URL; // Replace with your actual base URL
    const token = localStorage.getItem('access_token');

    // Initialization
    function init() {
        fetchCollectedRequests();
        setupEventListeners();
        initTheme();
    }

    // Event Listeners Setup
    function setupEventListeners() {
        addRequestBtn.addEventListener('click', () => openModal('add'));
        saveRequest.addEventListener('click', saveRequestHandler);
        searchInput.addEventListener('input', filterRequests);
        toggleBtn.addEventListener('click', toggleMobileMenu);
        logoutBtn.addEventListener('click', handleLogout);
        themeToggle.addEventListener('click', toggleTheme);
        document.getElementById('cancelRequest').addEventListener('click', closeModal);
    }

    // Mobile Menu Toggle
    function toggleMobileMenu() {
        mainNav.classList.toggle('active');
        toggleBtn.classList.toggle('active');
    }

    // Theme Management
    function initTheme() {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        document.body.classList.toggle('dark-mode', isDarkMode);
        themeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    function toggleTheme() {
        const isDarkMode = !document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', !isDarkMode);
        themeToggle.innerHTML = !isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    // Logout Handler
    function handleLogout(e) {
        e.preventDefault();
        localStorage.clear();
        alert('Logged out successfully');
        window.location.href = './index.html';
    }

    // API Request Functions
    function fetchCollectedRequests() {
        showLoader();
        fetch(`${baseUrl}/requests/collected/`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(handleResponse)
            .then(data => {
                allRequests = data;
                updateUI(data);
            })
            .catch(showError)
            .finally(hideLoader);
    }

    function updateUI(requests) {
        if (requests.length > 0) {
            emptyState.classList.add('hidden');
            requestsTable.classList.remove('hidden');
            renderRequests(requests);
        } else {
            emptyState.classList.remove('hidden');
            requestsTable.classList.add('hidden');
        }
    }

    // UI Rendering Functions
    function renderRequests(requests) {
        requestsTableBody.innerHTML = '';

        requests.forEach((request, index) => {
            const row = document.createElement('tr');
            row.dataset.id = request.id;

            row.innerHTML = `
                <td>${index + 1}</td>
                <td><span class="method-badge ${request.request_method.toLowerCase()}">${request.request_method}</span></td>
                <td class="request-name-cell">${request.request_name}</td>
                <td class="url-cell">${request.request_url}</td>
                <td class="actions-cell">
                    <button class="btn-edit" data-id="${request.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" data-id="${request.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;

            requestsTableBody.appendChild(row);
        });

        setupRowEventListeners();
    }

    function setupRowEventListeners() {
        document.querySelectorAll('.btn-edit').forEach(btn =>
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                openModal('edit', btn.dataset.id);
            })
        );

        document.querySelectorAll('.btn-delete').forEach(btn =>
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteRequest(btn.dataset.id);
            })
        );

        document.querySelectorAll('tbody tr').forEach(row =>
            row.addEventListener('click', () => {
                const requestId = row.dataset.id;
                window.location.href = `builder.html?id=${requestId}`;
            })
        );
    }

    // Modal Functions
    function openModal(mode, id = null) {
        modal.classList.remove('hidden');
        modalTitle.textContent = mode === 'edit' ? 'Edit Request' : 'Add Request';

        if (mode === 'edit') {
            currentEditId = id;
            const request = allRequests.find(req => req.id == id);
            requestName.value = request.request_name;
            requestType.value = request.request_method;
            requestData.value = request.request_url;
        } else {
            currentEditId = null;
            requestName.value = '';
            requestType.value = 'GET';
            requestData.value = '';
        }
    }

    function closeModal() {
        modal.classList.add('hidden');
        currentEditId = null;
    }

    // CRUD Operations
    function saveRequestHandler() {
        const request = {
            request_name: requestName.value,
            request_method: requestType.value,
            request_url: requestData.value,
            is_collected: true
        };

        showLoader();
        const url = currentEditId
            ? `${baseUrl}/requests/update/${currentEditId}/`
            : `${baseUrl}/requests/add/`;
        const method = currentEditId ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(request)
        })
            .then(handleResponse)
            .then(() => {
                fetchCollectedRequests();
                closeModal();
            })
            .catch(showError)
            .finally(hideLoader);
    }

    function deleteRequest(id) {
        if (!confirm('Are you sure you want to delete this request?')) return;

        showLoader();
        fetch(`${baseUrl}/requests/delete/${id}/`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(handleResponse)
            .then(() => fetchCollectedRequests())
            .catch(showError)
            .finally(hideLoader);
    }

    // Utility Functions
    function filterRequests() {
        const searchTerm = searchInput.value.toLowerCase();
        const filtered = allRequests.filter(request =>
            request.request_name.toLowerCase().includes(searchTerm) ||
            request.request_url.toLowerCase().includes(searchTerm) ||
            request.request_method.toLowerCase().includes(searchTerm)
        );
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
        console.error("Error: ", error);
        let errorMessage = "An error occurred.";

        if (error?.response?.status === 401) {
            alert("Session expired. Redirecting to login...");
            window.location.href = "../index.html";
            return;
        }

        if (error.error) {
            errorMessage = error.error;
        } else if (error.message) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }

        alert(errorMessage);
    }

    function showLoader() {
        document.getElementById('loader').style.display = 'block';
    }

    function hideLoader() {
        document.getElementById('loader').style.display = 'none';
    }

    // Initialize the application
    init();
});
document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    const searchInput = document.getElementById('variable-search');
    const addVariableBtn = document.getElementById('add-variable-btn');
    const variablesTableBody = document.getElementById('variables-table-body');
    const variableModal = document.getElementById('variable-modal');
    const modalTitle = document.getElementById('modal-title');
    const variableForm = document.getElementById('variable-form');
    const variableNameInput = document.getElementById('variable-name');
    const variableValueInput = document.getElementById('variable-value');
    const closeModalButtons = document.querySelectorAll('.close-modal');
    const baseUrl = BE_URL;
    const token = localStorage.getItem("access_token");
    const toggleBtn = document.getElementById('mobile-toggle');
    const navLinks = document.getElementById('nav-links');
    const logoutBtn = document.getElementById('logout-btn');

    toggleBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        alert('Logged out successfully');
        window.location.href = './index.html';
    });

    let currentEditId = null;
    let allVariables = [];

    initTheme();
    fetchVariables();

    themeToggle.addEventListener('click', toggleTheme);
    searchInput.addEventListener('input', handleSearch);
    addVariableBtn.addEventListener('click', openAddVariableModal);
    variableForm.addEventListener('submit', handleVariableSubmit);
    closeModalButtons.forEach(button => button.addEventListener('click', closeModal));
    window.addEventListener('click', e => { if (e.target === variableModal) closeModal(); });

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

    function fetchVariables() {
        showLoader();
        fetch(`${baseUrl}/envs/`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(handleResponse)
        .then(data => {
            allVariables = data;
            renderVariables(allVariables);
        })
        .catch(showError)
        .finally(hideLoader);
    }

    function renderVariables(variables) {
        variablesTableBody.innerHTML = variables.length === 0
            ? `<tr><td colspan="4" class="no-variables">No variables found</td></tr>`
            : variables.map((variable, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${variable.variable_name}</td>
                    <td>${variable.value}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn edit-btn" data-id="${variable.id}">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="action-btn delete-btn" data-id="${variable.id}">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');

        document.querySelectorAll('.edit-btn').forEach(btn =>
            btn.addEventListener('click', () => openEditVariableModal(+btn.dataset.id))
        );
        document.querySelectorAll('.delete-btn').forEach(btn =>
            btn.addEventListener('click', () => deleteVariableHandler(+btn.dataset.id))
        );
    }

    function handleSearch() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const filtered = allVariables.filter(v => v.variable_name.toLowerCase().includes(searchTerm));
        renderVariables(filtered);
    }

    function openAddVariableModal() {
        currentEditId = null;
        modalTitle.textContent = 'Add New Variable';
        variableNameInput.value = '';
        variableValueInput.value = '';
        variableModal.style.display = 'block';
    }

    function openEditVariableModal(id) {
        const variable = allVariables.find(v => v.id === id);
        if (variable) {
            currentEditId = id;
            modalTitle.textContent = 'Edit Variable';
            variableNameInput.value = variable.variable_name;
            variableValueInput.value = variable.value;
            variableModal.style.display = 'block';
        }
    }

    function closeModal() {
        variableModal.style.display = 'none';
        currentEditId = null;
    }

    function handleVariableSubmit(e) {
        e.preventDefault();

        const variable_name = variableNameInput.value.trim();
        const value = variableValueInput.value.trim();
        if (!variable_name || !value) return alert('Please fill in all fields.');

        const variableData = { variable_name, value };
        const url = currentEditId 
            ? `${baseUrl}/envs/update/${currentEditId}/`
            : `${baseUrl}/envs/add/`;
        const method = currentEditId ? 'PUT' : 'POST';

        showLoader();
        fetch(url, {
            method: method,
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(variableData)
        })
        .then(handleResponse)
        .then(response => {
            alert(response.message);
            fetchVariables(response.id);
            closeModal();
        })
        .catch(showError)
        .finally(hideLoader);
    }

    function deleteVariableHandler(id) {
        if (!confirm('Are you sure you want to delete this variable?')) return;

        showLoader();
        fetch(`${baseUrl}/envs/delete/${id}/`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(handleResponse)
        .then(response => {
            alert(response.message);
            fetchVariables();
        })
        .catch(showError)
        .finally(hideLoader);
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
});
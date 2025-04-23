document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const darkModeToggle = document.getElementById('theme-toggle');
    const mobileMenuBtn = document.getElementById('mobile-toggle');
    const mainNav = document.getElementById('main-nav');
    const requestTabs = document.querySelectorAll('.request-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const requestMethod = document.querySelector('.request-method');
    const requestUrl = document.querySelector('.request-url');
    const requestSend = document.querySelector('.request-send');
    const addParamBtn = document.querySelector('.add-param');
    const paramInputs = document.querySelector('.param-inputs');
    const authType = document.querySelector('.auth-type');
    const authContents = document.querySelectorAll('.auth-content');
    const addHeaderBtn = document.querySelector('.add-header');
    const headerInputs = document.querySelector('.header-inputs');
    const bodyTypes = document.querySelectorAll('.body-type');
    const bodyContents = document.querySelectorAll('.body-content');
    const addFormDataBtn = document.querySelector('.add-form-data');
    const formDataInputs = document.querySelector('#form-data-body');
    const prettyResponseBtn = document.getElementById('pretty-response');
    const copyResponseBtn = document.getElementById('copy-response');
    const responseBody = document.querySelector('#response-body pre code');
    const responseStatus = document.querySelector('.status-badge');
    const responseTime = document.querySelector('.response-time');
    const fetchEnvVarsBtn = document.getElementById('fetch-env-vars');
    const addEnvVarBtn = document.getElementById('add-env-var');
    const saveEnvVarsBtn = document.getElementById('save-env-vars');
    const envVariables = document.querySelector('.env-variables');
    const variableModal = document.getElementById('variable-modal');
    const variableList = document.querySelector('.variable-list');
    const modalClose = document.querySelector('.modal-close');
    const addVariableBtns = document.querySelectorAll('.add-variable');

    // Environment variables
    let envVars = {}, requestName;
    let currentVariableTarget = null;
    const BASE_URL = 'http://127.0.0.1:8000';
    let authToken = localStorage.getItem('access_token') || '';
    let currentRequestId = null;

    // Initialize
    init();

    function init() {
        setupEventListeners();
        checkForRequestId();
        fetchEnvironmentVariables()
            .catch(error => {
                console.error('Error loading environment variables:', error);
                showError('Failed to load environment variables');
            });
    }

    function checkForRequestId() {
        const urlParams = new URLSearchParams(window.location.search);
        const requestId = urlParams.get('id');

        if (requestId) {
            currentRequestId = requestId;
            fetchRequestDetails(requestId)
                .then(request => {
                    requestMethod.value = request.request_method;
                    requestMethod.className = `request-method ${request.request_method.toLowerCase()}`;
                    requestUrl.value = request.request_url;
                    requestName = request.request_name;
                })
                .catch(error => {
                    console.error('Error fetching request details:', error);
                    showError('Failed to load request details');
                });
        }
    }

    function fetchRequestDetails(requestId) {
        return fetch(`${BASE_URL}/requests/specific/${requestId}/`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        })
            .then(handleResponse)
            .then(data => {
                return data;
            })
            .catch(error => {
                console.error('Error fetching request details:', error);
                throw error;
            });
    }

    async function saveRequestDetails() {
        const method = requestMethod.value;
        const rawUrl = requestUrl.value.trim();
        const url = await replaceVariables(rawUrl);
        const getRequestName = requestName;

        if (!url) {
            return Promise.resolve();
        }

        const requestData = {
            request_method: method,
            request_name: currentRequestId ? getRequestName : "New Request",
            request_url: url,
            is_collected: currentRequestId ? "true" : "false"
        };
        const endpoint = currentRequestId
            ? `${BASE_URL}/requests/update/${currentRequestId}/`
            : `${BASE_URL}/requests/add/`;

        const methodType = currentRequestId ? 'PUT' : 'POST';

        return fetch(endpoint, {
            method: methodType,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(requestData)
        })
            .then(handleResponse)
            .then(data => {
                if (!currentRequestId) {
                    currentRequestId = data.id;
                }
                return data;
            })
            .catch(error => {
                console.error('Error saving request:', error);
                throw error;
            });
    }


    function setupEventListeners() {
        darkModeToggle.addEventListener('click', toggleDarkMode);
        mobileMenuBtn.addEventListener('click', function () {
            mainNav.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
        });
        requestTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                requestTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const tabId = tab.getAttribute('data-tab');
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === `${tabId}-tab`) {
                        content.classList.add('active');
                    }
                });
            });
        });

        // Body type selector
        bodyTypes.forEach(type => {
            type.addEventListener('click', () => {
                bodyTypes.forEach(t => t.classList.remove('active'));
                type.classList.add('active');

                const typeId = type.getAttribute('data-type');
                bodyContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === `${typeId}-body` ||
                        (typeId === 'none' && content.id === 'raw-body')) {
                        content.classList.add('active');
                    }
                });
            });
        });

        // Auth type selector
        authType.addEventListener('change', function () {
            authContents.forEach(content => content.classList.remove('active'));
            const selectedAuth = this.value;
            if (selectedAuth !== 'none') {
                document.getElementById(`${selectedAuth}-auth`).classList.add('active');
            }
        });

        // Add parameter row
        addParamBtn.addEventListener('click', addParamRow);

        // Add header row
        addHeaderBtn.addEventListener('click', addHeaderRow);

        // Add form data row
        addFormDataBtn.addEventListener('click', addFormDataRow);

        // Set request method class
        requestMethod.addEventListener('change', function () {
            requestMethod.className = `request-method ${this.value.toLowerCase()}`;
        });

        // Send request
        requestSend.addEventListener('click', function () {
            saveRequestDetails()
                .then(() => {
                    sendRequest();
                })
                .catch(error => {
                    console.error('Error saving request details:', error);
                    sendRequest();
                });
        });

        // Pretty response
        prettyResponseBtn.addEventListener('click', prettyResponse);

        // Copy response
        copyResponseBtn.addEventListener('click', copyResponse);

        // Environment variables
        fetchEnvVarsBtn.addEventListener('click', function () {
            fetchEnvironmentVariables()
                .then(() => showSuccess('Environment variables refreshed'))
                .catch(error => showError('Failed to refresh variables'));
        });

        addEnvVarBtn.addEventListener('click', addEnvVarRow);
        saveEnvVarsBtn.addEventListener('click', saveEnvVars);

        // Variable modal
        addVariableBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                currentVariableTarget = this.getAttribute('data-target');
                showVariableModal();
            });
        });

        modalClose.addEventListener('click', hideVariableModal);
        variableModal.addEventListener('click', function (e) {
            if (e.target === this) {
                hideVariableModal();
            }
        });

        initDeleteButtons();
    }

    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        darkModeToggle.innerHTML = isDark
            ? '<i class="fas fa-sun"></i>'
            : '<i class="fas fa-moon"></i>';
        localStorage.setItem('darkMode', isDark);
    }

    function addParamRow() {
        const paramRow = document.createElement('div');
        paramRow.className = 'param-row';
        paramRow.innerHTML = `
            <input type="text" placeholder="Key" class="param-key">
            <input type="text" placeholder="Value" class="param-value">
            <button class="btn btn-secondary param-delete"><i class="fas fa-trash"></i></button>
            <button class="btn btn-secondary add-variable" data-target="param-value">
                <i class="fas fa-cube"></i> Add Variable
            </button>
        `;
        paramInputs.appendChild(paramRow);

        paramRow.querySelector('.param-delete').addEventListener('click', function () {
            paramRow.remove();
        });

        paramRow.querySelector('.add-variable').addEventListener('click', function () {
            currentVariableTarget = this.getAttribute('data-target');
            showVariableModal();
        });
    }

    function addHeaderRow() {
        const headerRow = document.createElement('div');
        headerRow.className = 'header-row';
        headerRow.innerHTML = `
            <input type="text" placeholder="Header" class="header-key">
            <input type="text" placeholder="Value" class="header-value">
            <button class="btn btn-secondary header-delete"><i class="fas fa-trash"></i></button>
            <button class="btn btn-secondary add-variable" data-target="header-value">
                <i class="fas fa-cube"></i> Add Variable
            </button>
        `;
        headerInputs.appendChild(headerRow);

        headerRow.querySelector('.header-delete').addEventListener('click', function () {
            headerRow.remove();
        });

        headerRow.querySelector('.add-variable').addEventListener('click', function () {
            currentVariableTarget = this.getAttribute('data-target');
            showVariableModal();
        });
    }

    function addFormDataRow() {
        const formDataRow = document.createElement('div');
        formDataRow.className = 'form-data-row';
        formDataRow.innerHTML = `
            <input type="text" placeholder="Key" class="form-data-key">
            <input type="text" placeholder="Value" class="form-data-value">
            <button class="btn btn-secondary form-data-delete"><i class="fas fa-trash"></i></button>
            <button class="btn btn-secondary add-variable" data-target="form-data-value">
                <i class="fas fa-cube"></i> Add Variable
            </button>
        `;
        formDataInputs.insertBefore(formDataRow, addFormDataBtn);

        formDataRow.querySelector('.form-data-delete').addEventListener('click', function () {
            formDataRow.remove();
        });

        formDataRow.querySelector('.add-variable').addEventListener('click', function () {
            currentVariableTarget = this.getAttribute('data-target');
            showVariableModal();
        });
    }

    function addEnvVarRow() {
        const envVarRow = document.createElement('div');
        envVarRow.className = 'env-var-row';
        envVarRow.innerHTML = `
            <input type="text" class="env-var-key" placeholder="Variable Name">
            <input type="text" class="env-var-value" placeholder="Variable Value">
            <button class="btn btn-secondary env-var-delete"><i class="fas fa-trash"></i></button>
        `;
        envVariables.appendChild(envVarRow);

        envVarRow.querySelector('.env-var-delete').addEventListener('click', function () {
            envVarRow.remove();
        });
    }

    function initDeleteButtons() {
        document.querySelectorAll('.param-delete').forEach(btn => {
            btn.addEventListener('click', function () {
                this.closest('.param-row').remove();
            });
        });

        document.querySelectorAll('.header-delete').forEach(btn => {
            btn.addEventListener('click', function () {
                this.closest('.header-row').remove();
            });
        });

        document.querySelectorAll('.form-data-delete').forEach(btn => {
            btn.addEventListener('click', function () {
                this.closest('.form-data-row').remove();
            });
        });

        document.querySelectorAll('.env-var-delete').forEach(btn => {
            btn.addEventListener('click', function () {
                this.closest('.env-var-row').remove();
            });
        });
    }

    function showVariableModal() {
        fetchEnvironmentVariables()
            .then(() => {
                variableList.innerHTML = '';

                for (const [key, value] of Object.entries(envVars)) {
                    const varItem = document.createElement('div');
                    varItem.className = 'variable-item';
                    varItem.innerHTML = `
                        <div class="var-name">{{${key}}}</div>
                        <div class="var-value">${value}</div>
                    `;
                    varItem.addEventListener('click', () => {
                        insertVariable(`{{${key}}}`);
                        hideVariableModal();
                    });
                    variableList.appendChild(varItem);
                }

                variableModal.classList.add('active');
            })
            .catch(error => {
                console.error('Error loading variables:', error);
                showError('Failed to load variables');
            });
    }

    function hideVariableModal() {
        variableModal.classList.remove('active');
    }

    function insertVariable(variable) {
        if (!currentVariableTarget) return;

        let input;

        if (currentVariableTarget === 'raw-input') {
            input = document.querySelector('.raw-input');
        } else {
            const activeRow = document.activeElement.closest('.param-row, .header-row, .form-data-row');
            if (activeRow) {
                input = activeRow.querySelector(`.${currentVariableTarget}`);
            }
        }

        if (input) {
            const startPos = input.selectionStart;
            const endPos = input.selectionEnd;
            const currentValue = input.value;

            input.value = currentValue.substring(0, startPos) + variable + currentValue.substring(endPos);

            input.selectionStart = input.selectionEnd = startPos + variable.length;
            input.focus();
        }
    }

    function fetchEnvironmentVariables() {
        return fetch(`${BASE_URL}/envs/`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        })
            .then(handleResponse)
            .then(data => {
                envVars = data;
                updateEnvVarsUI();
                return data;
            })
            .catch(error => {
                console.error('Error fetching environment variables:', error);
                throw error;
            });
    }

    function fetchSpecificVariable(variableName) {
        return fetch(`${BASE_URL}/envs/specific?variable_name=${encodeURIComponent(variableName)}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        })
            .then(handleResponse)
            .then(data => {
                envVars[variableName] = data.value;
                return data.value;
            })
            .catch(error => {
                console.error(`Error fetching variable ${variableName}:`, error);
                throw error;
            });
    }

    function saveEnvVars() {
        const newEnvVars = {};

        document.querySelectorAll('.env-var-row').forEach(row => {
            const key = row.querySelector('.env-var-key').value.trim();
            const value = row.querySelector('.env-var-value').value.trim();
            if (key) {
                newEnvVars[key] = value;
            }
        });

        fetch(`${BASE_URL}/envs/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(newEnvVars)
        })
            .then(handleResponse)
            .then(() => {
                envVars = newEnvVars;
                showSuccess('Environment variables saved!');
            })
            .catch(error => {
                console.error('Error saving environment variables:', error);
                showError('Failed to save environment variables');
            });
    }

    function updateEnvVarsUI() {
        envVariables.innerHTML = '';

        for (const [variable_name, value] of Object.entries(envVars)) {
            const envVarRow = document.createElement('div');
            envVarRow.className = 'env-var-row';
            envVarRow.innerHTML = `
                <input type="text" class="env-var-key" placeholder="Variable Name" value="${variable_name}">
                <input type="text" class="env-var-value" placeholder="Variable Value" value="${value}">
                <button class="btn btn-secondary env-var-delete"><i class="fas fa-trash"></i></button>
            `;
            envVariables.appendChild(envVarRow);

            envVarRow.querySelector('.env-var-delete').addEventListener('click', function () {
                fetch(`${BASE_URL}/envs/delete/${variable_name}/`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    }
                })
                    .then(handleResponse)
                    .then(() => {
                        envVarRow.remove();
                        delete envVars[variable_name];
                        showSuccess('Variable deleted');
                    })
                    .catch(error => {
                        console.error('Error deleting variable:', error);
                        showError('Failed to delete variable');
                    });
            });
        }
    }

    async function replaceVariables(text) {
        if (!text || typeof text !== 'string') return text;

        const variablePattern = /\{\{([^}]+)\}\}/g;
        let result = text;
        let match;
        const variablesToFetch = [];

        while ((match = variablePattern.exec(text)) !== null) {
            const fullMatch = match[0];
            const varName = match[1];

            if (envVars[varName] === undefined) {
                variablesToFetch.push(varName);
            }
        }

        if (variablesToFetch.length > 0) {
            await Promise.all(
                variablesToFetch.map(varName =>
                    fetchSpecificVariable(varName)
                        .catch(() => null)
                )
            );
        }

        // Now do the actual replacement
        return text.replace(variablePattern, (match, varName) => {
            return envVars[varName] !== undefined ? envVars[varName] : match;
        });
    }

    async function sendRequest() {
        const method = requestMethod.value;
        let url = requestUrl.value.trim();

        if (!url) {
            showError('Please enter a URL');
            return;
        }

        try {
            // Show loading state
            responseStatus.textContent = 'Sending...';
            responseStatus.className = 'status-badge';
            responseTime.textContent = '';

            // Start timer
            const startTime = Date.now();
            url = await replaceVariables(url);

            // Process query parameters
            const params = [];
            const paramElements = document.querySelectorAll('.param-row');

            for (const row of paramElements) {
                const key = await replaceVariables(row.querySelector('.param-key').value.trim());
                const value = await replaceVariables(row.querySelector('.param-value').value.trim());
                if (key) {
                    params.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
                }
            }

            if (params.length > 0) {
                url += (url.includes('?') ? '&' : '?') + params.join('&');
            }

            // Process headers
            const headers = {};
            const headerElements = document.querySelectorAll('.header-row');

            for (const row of headerElements) {
                const key = await replaceVariables(row.querySelector('.header-key').value.trim());
                const value = await replaceVariables(row.querySelector('.header-value').value.trim());
                if (key) {
                    headers[key] = value;
                }
            }

            // Process authentication
            const authTypeValue = authType.value;
            if (authTypeValue === 'bearer') {
                const token = await replaceVariables(document.querySelector('#bearer-auth .auth-input').value.trim());
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
            } else if (authTypeValue === 'basic') {
                const username = await replaceVariables(document.querySelector('#basic-auth .auth-input:nth-child(1)').value.trim());
                const password = await replaceVariables(document.querySelector('#basic-auth .auth-input:nth-child(2)').value.trim());
                if (username && password) {
                    headers['Authorization'] = `Basic ${btoa(`${username}:${password}`)}`;
                }
            }

            // Process request body
            let body = null;
            const activeBodyType = document.querySelector('.body-type.active').getAttribute('data-type');

            if (activeBodyType === 'raw') {
                const rawBody = await replaceVariables(document.querySelector('.raw-input').value.trim());
                if (rawBody) {
                    body = rawBody;
                    if (!headers['Content-Type']) {
                        headers['Content-Type'] = 'application/json';
                    }
                }
            } else if (activeBodyType === 'form-data') {
                const formData = new FormData();
                const formDataElements = document.querySelectorAll('.form-data-row');

                for (const row of formDataElements) {
                    const key = await replaceVariables(row.querySelector('.form-data-key').value.trim());
                    const value = await replaceVariables(row.querySelector('.form-data-value').value.trim());
                    if (key) {
                        formData.append(key, value);
                    }
                }

                if (formData.entries().next().value) {
                    body = formData;
                    delete headers['Content-Type'];
                }
            }

            // Make the request
            const response = await fetch(url, {
                method,
                headers: Object.keys(headers).length > 0 ? headers : undefined,
                body: body instanceof FormData ? body : (body ? body : null)
            });

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Update UI with response
            responseStatus.textContent = `${response.status} ${response.statusText}`;
            responseStatus.className = `status-badge ${response.ok ? 'status-success' : 'status-error'}`;
            responseTime.textContent = `${duration}ms`;

            try {
                const data = await response.json();
                responseBody.innerHTML = syntaxHighlight(JSON.stringify(data, null, 2));
            } catch (e) {
                try {
                    const text = await response.text();
                    responseBody.textContent = text;
                } catch (e) {
                    responseBody.textContent = 'No response body';
                }
            }
        } catch (error) {
            const endTime = Date.now();
            const duration = endTime - Date.now();

            responseStatus.textContent = 'Error';
            responseStatus.className = 'status-badge status-error';
            responseTime.textContent = `${duration}ms`;
            responseBody.textContent = error.message;
            showError(error.message);
        }
    }

    function prettyResponse() {
        try {
            const json = JSON.parse(responseBody.textContent);
            responseBody.innerHTML = syntaxHighlight(JSON.stringify(json, null, 2));
        } catch (e) {
            // Not JSON
        }
    }

    function copyResponse() {
        const range = document.createRange();
        range.selectNode(responseBody);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        document.execCommand('copy');
        window.getSelection().removeAllRanges();

        const originalText = copyResponseBtn.innerHTML;
        copyResponseBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            copyResponseBtn.innerHTML = originalText;
        }, 2000);
    }

    function syntaxHighlight(json) {
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-key';
                } else {
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
    }

    function handleResponse(response) {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.message || 'Request failed');
            }).catch(() => {
                throw new Error(response.statusText || 'Request failed');
            });
        }
        return response.json();
    }

    function showError(message) {
        alert(`Error: ${message}`);
    }

    function showSuccess(message) {
        alert(`Success: ${message}`);
    }

    // Check for saved dark mode preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
    }
});
// Global AJAX utilities and UI components
(function() {
    'use strict';

    // Toast Notification System
    const Toast = {
        container: null,
        
        init: function() {
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.id = 'toast-container';
                this.container.style.cssText = `
                    position: fixed;
                    top: 20px;
                    left: 20px;
                    z-index: 10000;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                `;
                document.body.appendChild(this.container);
            }
        },
        
        show: function(message, type = 'success', duration = 3000) {
            this.init();
            const toast = document.createElement('div');
            toast.style.cssText = `
                background: ${type === 'success' ? '#00c875' : type === 'error' ? '#d66b74' : '#0073ea'};
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                min-width: 250px;
                animation: slideIn 0.3s ease-out;
                font-family: 'Heebo', sans-serif;
                font-size: 14px;
            `;
            
            // Add animation
            if (!document.querySelector('#toast-styles')) {
                const style = document.createElement('style');
                style.id = 'toast-styles';
                style.textContent = `
                    @keyframes slideIn {
                        from { transform: translateX(-100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                    @keyframes slideOut {
                        from { transform: translateX(0); opacity: 1; }
                        to { transform: translateX(-100%); opacity: 0; }
                    }
                `;
                document.head.appendChild(style);
            }
            
            toast.textContent = message;
            this.container.appendChild(toast);
            
            setTimeout(() => {
                toast.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
    };

    // Loading Overlay
    const Loader = {
        show: function(target = null) {
            const loader = document.createElement('div');
            loader.className = 'ajax-loader';
            loader.style.cssText = `
                position: ${target ? 'absolute' : 'fixed'};
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255,255,255,0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            `;
            loader.innerHTML = `
                <div style="
                    width: 50px;
                    height: 50px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #0073ea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                "></div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
            (target || document.body).appendChild(loader);
            return loader;
        },
        
        hide: function(loader) {
            if (loader && loader.parentNode) {
                loader.remove();
            }
        }
    };

    // AJAX Request Handler
    const API = {
        getCsrfToken: function() {
            // Try to get CSRF token from meta tag
            const metaTag = document.querySelector('meta[name="csrf-token"]');
            if (metaTag) {
                return metaTag.getAttribute('content');
            }
            // Try to get from hidden input in any form
            const csrfInput = document.querySelector('input[name="csrf_token"]');
            if (csrfInput) {
                return csrfInput.value;
            }
            return null;
        },
        
        request: async function(url, options = {}) {
            const defaultHeaders = {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            };
            
            // Add CSRF token for POST/PUT/DELETE requests
            const method = (options.method || 'GET').toUpperCase();
            if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
                const csrfToken = API.getCsrfToken();
                if (csrfToken) {
                    defaultHeaders['X-CSRFToken'] = csrfToken;
                }
            }
            
            const defaultOptions = {
                headers: defaultHeaders,
                credentials: 'same-origin'
            };
            
            const mergedOptions = {
                ...defaultOptions,
                ...options,
                headers: { ...defaultOptions.headers, ...(options.headers || {}) }
            };
            
            // Handle FormData (for file uploads)
            if (options.body instanceof FormData) {
                delete mergedOptions.headers['Content-Type'];
            }
            
            try {
                const response = await fetch(url, mergedOptions);
                const contentType = response.headers.get('content-type');
                
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    return { ok: response.ok, data, status: response.status };
                } else {
                    const text = await response.text();
                    return { ok: response.ok, data: text, status: response.status };
                }
            } catch (error) {
                console.error('API Request Error:', error);
                return { ok: false, error: error.message };
            }
        },
        
        get: function(url) {
            return this.request(url, { method: 'GET' });
        },
        
        post: function(url, data) {
            const isFormData = data instanceof FormData;
            return this.request(url, {
                method: 'POST',
                body: isFormData ? data : JSON.stringify(data)
            });
        },
        
        put: function(url, data) {
            return this.request(url, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },
        
        delete: function(url) {
            return this.request(url, { method: 'DELETE' });
        }
    };

    // Form Handler - Convert forms to AJAX
    const FormHandler = {
        init: function() {
            // Handle all forms with data-ajax attribute
            document.addEventListener('submit', function(e) {
                const form = e.target;
                if (form.dataset.ajax === 'true' || form.classList.contains('ajax-form')) {
                    e.preventDefault();
                    FormHandler.submit(form);
                }
            });
        },
        
        submit: async function(form) {
            const formData = new FormData(form);
            const url = form.action;
            const method = form.method.toUpperCase();
            const loader = Loader.show(form.closest('.card, .container, body'));
            
            try {
                let result;
                if (form.enctype === 'multipart/form-data') {
                    // File upload
                    result = await API.request(url, {
                        method: method,
                        body: formData
                    });
                } else {
                    // Regular form
                    const data = Object.fromEntries(formData);
                    result = await API[method.toLowerCase()](url, data);
                }
                
                Loader.hide(loader);
                
                if (result.ok && result.data.status === 'success') {
                    Toast.show(result.data.message || 'הפעולה בוצעה בהצלחה', 'success');
                    
                    // Handle success callback
                    if (form.dataset.successCallback) {
                        const callback = window[form.dataset.successCallback];
                        if (typeof callback === 'function') {
                            callback(result.data);
                        }
                    }
                    
                    // Reset form if needed
                    if (form.dataset.reset === 'true') {
                        form.reset();
                    }
                } else {
                    Toast.show(result.data.error || result.data.message || 'אירעה שגיאה', 'error');
                }
            } catch (error) {
                Loader.hide(loader);
                Toast.show('שגיאה בהתקשרות לשרת', 'error');
                console.error('Form submission error:', error);
            }
        }
    };

    // State Management (simple)
    const State = {
        data: {},
        listeners: {},
        
        set: function(key, value) {
            this.data[key] = value;
            this.notify(key, value);
        },
        
        get: function(key) {
            return this.data[key];
        },
        
        subscribe: function(key, callback) {
            if (!this.listeners[key]) {
                this.listeners[key] = [];
            }
            this.listeners[key].push(callback);
        },
        
        notify: function(key, value) {
            if (this.listeners[key]) {
                this.listeners[key].forEach(callback => callback(value));
            }
        }
    };

    // Dynamic UI Builder
    const UI = {
        // Build task item HTML
        buildTaskItem: function(task, projectId, clientId, index) {
            return `
                <div class="task-item" data-task-id="${task.id}">
                    <div class="task-content">
                        <input type="checkbox" 
                               ${task.status === 'בוצע' ? 'checked' : ''}
                               onchange="TaskManager.toggleStatus('${clientId}', '${projectId}', '${task.id}', this.checked)">
                        <span class="${task.status === 'בוצע' ? 'task-done' : ''}">${task.desc || task.title}</span>
                        <small style="color: #999; margin-right: 10px;">${task.created_date || ''}</small>
                    </div>
                    <button onclick="TaskManager.delete('${clientId}', '${projectId}', '${task.id}')" 
                            class="btn btn-danger btn-small">מחק</button>
                </div>
            `;
        },
        
        // Build project card HTML
        buildProjectCard: function(project, clientId) {
            const tasksHtml = (project.tasks || []).map((task, idx) => 
                this.buildTaskItem(task, project.id, clientId, idx)
            ).join('');
            
            return `
                <div class="project-card" data-project-id="${project.id}">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3>${project.title}</h3>
                        <button onclick="ProjectManager.delete('${clientId}', '${project.id}')" 
                                class="btn btn-danger btn-small">מחק פרויקט</button>
                    </div>
                    <div class="tasks-container">${tasksHtml}</div>
                    <!-- Add task form will be inserted here -->
                </div>
            `;
        }
    };

    // Export to global scope
    window.Toast = Toast;
    window.Loader = Loader;
    window.API = API;
    window.FormHandler = FormHandler;
    window.State = State;
    window.UI = UI;
    
    // Initialize form handler when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', FormHandler.init);
    } else {
        FormHandler.init();
    }
})();


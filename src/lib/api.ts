import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add CSRF token if available
api.interceptors.request.use((config) => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect here - let React AuthContext handle auth flow
    // The Layout component will redirect to /login if user is not authenticated
    return Promise.reject(error);
  }
);

export default api;

// Helper functions for common API calls
export const apiClient = {
  get: (url: string, config?: any) => api.get(url, config),
  post: (url: string, data?: any, config?: any) => api.post(url, data, config),
  put: (url: string, data?: any, config?: any) => api.put(url, data, config),
  delete: (url: string, config?: any) => api.delete(url, config),
  patch: (url: string, data?: any, config?: any) => api.patch(url, data, config),
};

// Form data client for file uploads
const apiForm = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Request interceptor to add CSRF token if available
apiForm.interceptors.request.use((config) => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  return config;
});

// Response interceptor for error handling
apiForm.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect here - let React AuthContext handle auth flow
    // The Layout component will redirect to /login if user is not authenticated
    return Promise.reject(error);
  }
);

export const apiFormClient = {
  get: (url: string, config?: any) => apiForm.get(url, config),
  post: (url: string, data?: any, config?: any) => apiForm.post(url, data, config),
  put: (url: string, data?: any, config?: any) => apiForm.put(url, data, config),
  delete: (url: string, config?: any) => apiForm.delete(url, config),
  patch: (url: string, data?: any, config?: any) => apiForm.patch(url, data, config),
};


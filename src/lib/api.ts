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

/**
 * Studio direct-to-R2 upload.
 * 1) Ask the server for a presigned PUT url.
 * 2) PUT the file straight to R2 (bypasses the Flask server entirely).
 * 3) Register the uploaded file's metadata on the request.
 * Large files never pass through the app server.
 */
export async function uploadStudioFile(
  requestId: string,
  file: File,
  kind: 'source' | 'deliverable',
  onProgress?: (percent: number) => void
) {
  const presign = await apiClient.post('/api/studio/uploads/presign', {
    request_id: requestId,
    filename: file.name,
    content_type: file.type || 'application/octet-stream',
    kind,
  });
  if (!presign.data?.success) {
    throw new Error(presign.data?.error || 'שגיאה בקבלת קישור העלאה');
  }

  const { upload_url, object_key } = presign.data;

  // Direct PUT to R2 - no credentials, no CSRF, no server proxy.
  await axios.put(upload_url, file, {
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    },
  });

  const register = await apiClient.post(`/api/studio/requests/${requestId}/files`, {
    object_key,
    original_name: file.name,
    size: file.size,
    content_type: file.type,
    kind,
  });
  if (!register.data?.success) {
    throw new Error(register.data?.error || 'שגיאה ברישום הקובץ');
  }
  return register.data.file;
}


import axios from 'axios';

const rawBase = (import.meta.env.VITE_API_BASE_URL || '/api').trim();
const normalizedBase = rawBase.replace(/\/+$/, '');
const baseURL = normalizedBase.endsWith('/api') ? normalizedBase : `${normalizedBase}/api`;

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});


// Interceptor to inject JWT token into all outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('stratagem_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle unauthorized 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If we are not already on the login or register page, redirect
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('stratagem_token');
        localStorage.removeItem('stratagem_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Gemini AI API helpers
export const aiApi = {
  getStatus: () => api.get('/ai/status'),
  testKey: (apiKey) => api.post('/ai/test-key', { apiKey }),
  saveKey: (apiKey) => api.post('/ai/save-key', { apiKey }),
  generateBrief: (decisionId) => api.post(`/ai/decision/${decisionId}/brief`),
  askAssistant: (decisionId, question) => api.post(`/ai/decision/${decisionId}/ask`, { question })
};

export default api;

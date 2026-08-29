import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Attach JWT token to every request if present
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const authStorage = localStorage.getItem('agentflow_auth');
      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage);
          if (parsed?.state?.token) {
            config.headers.Authorization = `Bearer ${parsed.state.token}`;
          }
        } catch (e) {
          console.error('Failed to parse auth store from localStorage', e);
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept 401 unauthenticated errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        // Token expired or invalid
        // Let store handle clearing or redirect if necessary
      }
    }
    return Promise.reject(error);
  }
);

export default api;

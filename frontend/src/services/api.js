import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5008/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests if available
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('skillsathi_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Global response interceptor for clean error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // If unauthorized, we could clear local storage or redirect
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('skillsathi_token');
      localStorage.removeItem('skillsathi_user');
      // Dispatch custom event to let App.jsx know to logout
      window.dispatchEvent(new Event('auth-logout'));
    }
    return Promise.reject(error);
  }
);

export default API;

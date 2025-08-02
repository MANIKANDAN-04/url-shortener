import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export const urlAPI = {
  checkURL: async (urlData) => {
    const response = await api.post('/api/check-url', urlData);
    return response.data;
  },

  shortenURL: async (urlData) => {
    const response = await api.post('/api/shorten', urlData);
    return response.data;
  },

  getURLs: async (skip = 0, limit = 100) => {
    const response = await api.get(`/api/urls?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  getAnalytics: async (shortCode) => {
    const response = await api.get(`/api/analytics/${shortCode}`);
    return response.data;
  },

  deleteURL: async (shortCode) => {
    const response = await api.delete(`/api/urls/${shortCode}`);
    return response.data;
  },

  generateQRCode: async (shortCode) => {
    const response = await api.get(`/api/qr/${shortCode}`);
    return response.data;
  },
};

export default api;

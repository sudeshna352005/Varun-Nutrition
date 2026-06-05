import axios from 'axios';

export const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000'
  : 'https://varun-nutrition.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;

  // Handle local paths, normalize slashes and ensure base URL is prepended
  const normalizedPath = path.replace(/\\/g, '/');
  const cleanPath = normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath;

  return `${API_BASE_URL}/${cleanPath}`;
};

export default api;

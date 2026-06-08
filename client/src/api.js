import axios from 'axios';

// Use relative URL so it works with Vite proxy in dev and unified port in prod
export const API_BASE_URL = 'https://varun-nutrition.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;

  const normalizedPath = path.replace(/\\/g, '/');
  const cleanPath = normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath;

  return `/${cleanPath}`;
};

export default api;

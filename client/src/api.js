import axios from 'axios';

export const API_BASE_URL = window.location.origin;

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;

  const normalizedPath = path.replace(/\\/g, '/');
  const cleanPath = normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath;

  return `${API_BASE_URL}/${cleanPath}`;
};

export default api;

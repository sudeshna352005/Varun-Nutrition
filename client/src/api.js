import axios from 'axios';

export const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'https://varun-nutrition.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export default api;

import axios from 'axios';

export const API_BASE_URL = 'https://varun-nutrition.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export default api;
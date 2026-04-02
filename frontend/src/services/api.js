import axios from 'axios';

// Backend API base URL set করা
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api'
});

// আগের সেভ করা token থাকলে default header এ যোগ
const token = localStorage.getItem('ff_token');
if (token) {
  API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// প্রতি request এ latest token sync করে
API.interceptors.request.use((config) => {
  const currentToken = localStorage.getItem('ff_token');
  if (currentToken) {
    config.headers.Authorization = `Bearer ${currentToken}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

// login/logout এ token header update করার helper
export function setAuthToken(token) {
  if (token) API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete API.defaults.headers.common['Authorization'];
}

export default API;
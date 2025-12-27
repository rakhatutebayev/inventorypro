import axios, { AxiosInstance, AxiosError } from 'axios';

// Используем относительный путь для правильной работы с HTTPS
const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Убеждаемся, что baseURL является относительным путем (начинается с /)
const baseURL = API_URL.startsWith('http') ? API_URL : API_URL.startsWith('/') ? API_URL : `/${API_URL}`;

const api: AxiosInstance = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - добавляем токен к запросам
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - обрабатываем ошибки
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Токен невалидный или истек - очищаем и редиректим на логин
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;



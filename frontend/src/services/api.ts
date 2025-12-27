import axios, { AxiosInstance, AxiosError } from 'axios';

// Используем относительный путь для правильной работы с HTTPS
// Это гарантирует, что запросы будут использовать тот же протокол (HTTPS), что и страница
let API_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Если URL абсолютный с http://, заменяем на относительный путь
if (API_URL.startsWith('http://')) {
  // Извлекаем путь из URL (например, 'http://ams.it-uae.com/api/v1' -> '/api/v1')
  try {
    const url = new URL(API_URL);
    API_URL = url.pathname;
  } catch (e) {
    // Если не удалось распарсить, используем '/api/v1'
    API_URL = '/api/v1';
  }
}

// Убеждаемся, что baseURL является относительным путем (начинается с /)
// Относительный путь гарантирует использование того же протокола (HTTPS), что и текущая страница
const baseURL = API_URL.startsWith('/') ? API_URL : `/${API_URL}`;

const api: AxiosInstance = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - исправляем URL и добавляем токен
api.interceptors.request.use(
  (config) => {
    // Если по какой-то причине URL начинается с http://, заменяем на относительный путь
    if (config.url && config.url.startsWith('http://')) {
      try {
        const url = new URL(config.url);
        config.url = url.pathname + (url.search || '');
      } catch (e) {
        // Если не удалось распарсить, оставляем как есть
      }
    }
    // Проверяем baseURL
    if (config.baseURL && config.baseURL.startsWith('http://')) {
      try {
        const url = new URL(config.baseURL);
        config.baseURL = url.pathname;
      } catch (e) {
        config.baseURL = '/api/v1';
      }
    }
    // Добавляем токен аутентификации
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



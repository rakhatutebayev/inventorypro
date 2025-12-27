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
  // Важно: не используем allowAbsoluteUrls, чтобы гарантировать использование относительных путей
  // axios будет использовать window.location.origin, который будет https:// если страница загружена через HTTPS
});

// Request interceptor - исправляем URL и добавляем токен
api.interceptors.request.use(
  (config) => {
    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Принудительно используем относительные пути для HTTPS
    // Проверяем и исправляем baseURL
    if (config.baseURL) {
      if (config.baseURL.startsWith('http://')) {
        try {
          const url = new URL(config.baseURL);
          config.baseURL = url.pathname || '/api/v1';
        } catch (e) {
          config.baseURL = '/api/v1';
        }
      } else if (config.baseURL.startsWith('https://')) {
        // Даже если это HTTPS, используем относительный путь для консистентности
        try {
          const url = new URL(config.baseURL);
          config.baseURL = url.pathname || '/api/v1';
        } catch (e) {
          config.baseURL = '/api/v1';
        }
      }
    } else {
      // Если baseURL не установлен, устанавливаем относительный путь
      config.baseURL = '/api/v1';
    }
    
    // Проверяем и исправляем url (относительный путь к эндпоинту)
    if (config.url && config.url.startsWith('http://')) {
      try {
        const url = new URL(config.url);
        config.url = url.pathname + (url.search || '');
      } catch (e) {
        // Оставляем как есть, если не удалось распарсить
      }
    } else if (config.url && config.url.startsWith('https://')) {
      // Даже если это HTTPS, используем относительный путь
      try {
        const url = new URL(config.url);
        config.url = url.pathname + (url.search || '');
      } catch (e) {
        // Оставляем как есть
      }
    }
    
    // Добавляем токен аутентификации
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // ФИНАЛЬНАЯ ПРОВЕРКА: Проверяем, что baseURL точно относительный путь
    // Это защита на случай, если axios как-то изменил baseURL
    if (config.baseURL && !config.baseURL.startsWith('/')) {
      // Если baseURL не начинается с /, значит это может быть абсолютный URL
      // Принудительно устанавливаем относительный путь
      if (config.baseURL.includes('://')) {
        try {
          const url = new URL(config.baseURL);
          config.baseURL = url.pathname || '/api/v1';
        } catch (e) {
          config.baseURL = '/api/v1';
        }
      } else {
        // Если это не абсолютный URL и не начинается с /, добавляем /
        config.baseURL = '/' + config.baseURL.replace(/^\/+/, '');
      }
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



import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiConfig } from '../config/api';

let apiInstance: AxiosInstance | null = null;

export const createApiInstance = async (): Promise<AxiosInstance> => {
  const config = await getApiConfig();
  
  const api = axios.create({
    baseURL: config.baseUrl,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - добавляем токен к запросам
  api.interceptors.request.use(
    async (config) => {
      const token = await AsyncStorage.getItem('access_token');
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
    async (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Токен невалидный или истек - очищаем
        await AsyncStorage.removeItem('access_token');
      }
      return Promise.reject(error);
    }
  );

  return api;
};

export const getApi = async (): Promise<AxiosInstance> => {
  if (!apiInstance) {
    apiInstance = await createApiInstance();
  }
  return apiInstance;
};

export const resetApi = () => {
  apiInstance = null;
};


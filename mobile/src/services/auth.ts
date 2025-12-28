import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApi } from './api';
import { Token, LoginCredentials, User } from '../types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<Token> {
    const api = await getApi();
    
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    const response = await api.post<Token>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    if (response.data.access_token) {
      await AsyncStorage.setItem('access_token', response.data.access_token);
    }
    
    return response.data;
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('access_token');
  },

  async getCurrentUser(): Promise<User> {
    const api = await getApi();
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('access_token');
    return !!token;
  },
};


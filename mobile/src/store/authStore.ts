import { create } from 'zustand';
import { User } from '../types';
import { authService } from '../services/auth';
import { resetApi } from '../services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  
  logout: async () => {
    await authService.logout();
    resetApi();
    set({ user: null, isAuthenticated: false });
  },
  
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        const user = await authService.getCurrentUser();
        set({ user, isAuthenticated: true });
      } else {
        set({ user: null, isAuthenticated: false });
      }
    } catch (error) {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (username: string, password: string) => {
    set({ isLoading: true });
    try {
      await authService.login({ username, password });
      const user = await authService.getCurrentUser();
      set({ user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },
}));


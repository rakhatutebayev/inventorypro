import { create } from 'zustand';
import { User } from '../types';
import { authService } from '../services/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAuthInitialized: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isAuthInitialized: false,
  
  setUser: (user) => set({ user, isAuthenticated: !!user, isAuthInitialized: true }),
  
  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false, isAuthInitialized: true });
  },
  
  checkAuth: async () => {
    // Important: on page refresh we should not redirect to /login before auth check completes.
    set({ isAuthInitialized: false });
    if (authService.isAuthenticated()) {
      try {
        const user = await authService.getCurrentUser();
        set({ user, isAuthenticated: true, isAuthInitialized: true });
      } catch (error) {
        set({ user: null, isAuthenticated: false, isAuthInitialized: true });
      }
    } else {
      set({ user: null, isAuthenticated: false, isAuthInitialized: true });
    }
  },
}));



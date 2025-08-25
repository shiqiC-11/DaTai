import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  uid: string;
  nickname?: string;
  email?: string;
  createdAt: string;
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => {
        // Note: This only clears local state
        // For complete logout, call guard.logout() from Authing first
        set({ user: null, isAuthenticated: false });
        // Clear localStorage manually to ensure consistency
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage');
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
); 
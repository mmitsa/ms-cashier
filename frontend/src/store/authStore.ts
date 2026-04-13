import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserDto } from '@/types/api.types';

interface AuthState {
  user: UserDto | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: UserDto, token: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (user: Partial<UserDto>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token, refreshToken) => {
        localStorage.setItem('access_token', token);
        localStorage.setItem('refresh_token', refreshToken);
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
    }),
    {
      name: 'mpos-auth',
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { user, token } = response.data.data;
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return { success: true, user };
        } catch (err) {
          const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
          set({ isLoading: false, error: msg });
          return { success: false, error: msg };
        }
      },

      register: async (name, email, password, role = 'operator') => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/register', { name, email, password, role });
          const { user, token } = response.data.data;
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return { success: true, user };
        } catch (err) {
          const msg = err.response?.data?.message || 'Registration failed.';
          set({ isLoading: false, error: msg });
          return { success: false, error: msg };
        }
      },

      fetchProfile: async () => {
        const { token } = get();
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return null;
        }

        try {
          const response = await api.get('/auth/me');
          const user = response.data.data;
          set({ user, isAuthenticated: true });
          return user;
        } catch (err) {
          // If token expired, clear session
          set({ user: null, token: null, isAuthenticated: false });
          return null;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'agentflow_auth',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

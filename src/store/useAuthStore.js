import { create } from 'zustand';

// Helper to get initial state from localStorage
const getStoredAuth = () => {
  try {
    const token = localStorage.getItem('vc_token');
    const userJson = localStorage.getItem('vc_user');
    const user = userJson ? JSON.parse(userJson) : null;
    return {
      token,
      user,
      isAuthenticated: !!token
    };
  } catch (error) {
    console.error('Error reading auth from localStorage', error);
    return { token: null, user: null, isAuthenticated: false };
  }
};

const initialAuth = getStoredAuth();

export const useAuthStore = create((set) => ({
  user: initialAuth.user,
  token: initialAuth.token,
  isAuthenticated: initialAuth.isAuthenticated,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      if (apiUrl && !apiUrl.endsWith('/api') && !apiUrl.endsWith('/api/')) {
        apiUrl = `${apiUrl.replace(/\/$/, '')}/api`;
      }
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      localStorage.setItem('vc_token', data.token);
      localStorage.setItem('vc_user', JSON.stringify(data.user));

      set({
        token: data.token,
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      return { success: true };
    } catch (error) {
      set({ isLoading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  signup: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      if (apiUrl && !apiUrl.endsWith('/api') && !apiUrl.endsWith('/api/')) {
        apiUrl = `${apiUrl.replace(/\/$/, '')}/api`;
      }
      const res = await fetch(`${apiUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign up');
      }

      localStorage.setItem('vc_token', data.token);
      localStorage.setItem('vc_user', JSON.stringify(data.user));

      set({
        token: data.token,
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      return { success: true };
    } catch (error) {
      set({ isLoading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  logout: () => {
    localStorage.removeItem('vc_token');
    localStorage.removeItem('vc_user');
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      error: null
    });
  }
}));

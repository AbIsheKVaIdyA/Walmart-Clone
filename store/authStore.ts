import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { AuthState, User, UserRole } from "@/typings/authTypings";

interface AuthStore extends AuthState {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,

        setUser: (user) => {
          set({ user, isAuthenticated: !!user });
        },

        setLoading: (isLoading) => {
          set({ isLoading });
        },

        login: async (email: string, password: string) => {
          set({ isLoading: true });
          try {
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (data.success) {
              // Store token in localStorage
              if (data.token) {
                localStorage.setItem('auth-token', data.token);
              }
              set({ 
                user: data.user, 
                isAuthenticated: true, 
                isLoading: false 
              });
              return { success: true };
            } else {
              set({ isLoading: false });
              return { success: false, error: data.error };
            }
          } catch (error) {
            set({ isLoading: false });
            return { success: false, error: 'Network error occurred' };
          }
        },

        signup: async (email: string, password: string, name: string, role: UserRole = UserRole.CUSTOMER) => {
          set({ isLoading: true });
          try {
            const response = await fetch('/api/auth/signup', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email, password, name, role }),
            });

            const data = await response.json();

            if (data.success) {
              // Store token in localStorage
              if (data.token) {
                localStorage.setItem('auth-token', data.token);
              }
              set({ 
                user: data.user, 
                isAuthenticated: true, 
                isLoading: false 
              });
              return { success: true };
            } else {
              set({ isLoading: false });
              return { success: false, error: data.error };
            }
          } catch (error) {
            set({ isLoading: false });
            return { success: false, error: 'Network error occurred' };
          }
        },

        logout: () => {
          set({ user: null, isAuthenticated: false });
          // Clear any stored tokens
          localStorage.removeItem('auth-token');
        },

        checkAuth: async () => {
          set({ isLoading: true });
          try {
            const token = localStorage.getItem('auth-token');
            if (!token) {
              set({ isLoading: false });
              return;
            }

            const response = await fetch('/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });

            const data = await response.json();

            if (data.success) {
              set({ 
                user: data.user, 
                isAuthenticated: true, 
                isLoading: false 
              });
            } else {
              set({ user: null, isAuthenticated: false, isLoading: false });
              localStorage.removeItem('auth-token');
            }
          } catch (error) {
            set({ user: null, isAuthenticated: false, isLoading: false });
            localStorage.removeItem('auth-token');
          }
        },
      }),
      {
        name: "auth-storage",
        partialize: (state) => ({ 
          user: state.user, 
          isAuthenticated: state.isAuthenticated 
        }),
      }
    )
  )
);

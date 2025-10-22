import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FirebaseAuthService } from '@/lib/firebaseAuthClient';
import { User, UserRole } from '@/typings/authTypings';

interface FirebaseAuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signupWithEmail: (email: string, password: string, name: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useFirebaseAuthStore = create<FirebaseAuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      loginWithEmail: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await FirebaseAuthService.signInWithEmail(email, password);
          
          if (result.success && result.user) {
            set({ 
              user: result.user, 
              isAuthenticated: true, 
              isLoading: false, 
              error: null 
            });
            return { success: true };
          } else {
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false, 
              error: result.error || 'Login failed' 
            });
            return { success: false, error: result.error };
          }
        } catch (error: any) {
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false, 
            error: error.message 
          });
          return { success: false, error: error.message };
        }
      },

      loginWithGoogle: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await FirebaseAuthService.signInWithGoogle();
          
          if (result.success && result.user) {
            set({ 
              user: result.user, 
              isAuthenticated: true, 
              isLoading: false, 
              error: null 
            });
            return { success: true };
          } else {
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false, 
              error: result.error || 'Google login failed' 
            });
            return { success: false, error: result.error };
          }
        } catch (error: any) {
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false, 
            error: error.message 
          });
          return { success: false, error: error.message };
        }
      },

      signupWithEmail: async (email: string, password: string, name: string, role: UserRole = UserRole.CUSTOMER) => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await FirebaseAuthService.signUpWithEmail(email, password, name, role);
          
          if (result.success && result.user) {
            set({ 
              user: result.user, 
              isAuthenticated: true, 
              isLoading: false, 
              error: null 
            });
            return { success: true };
          } else {
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false, 
              error: result.error || 'Signup failed' 
            });
            return { success: false, error: result.error };
          }
        } catch (error: any) {
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false, 
            error: error.message 
          });
          return { success: false, error: error.message };
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          await FirebaseAuthService.signOut();
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false, 
            error: null 
          });
        } catch (error: any) {
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false, 
            error: error.message 
          });
        }
      },

      updateProfile: async (updates: Partial<User>) => {
        const { user } = get();
        if (!user) {
          return { success: false, error: 'No user logged in' };
        }

        set({ isLoading: true, error: null });
        
        try {
          const result = await FirebaseAuthService.updateUserProfile(user.id, updates);
          
          if (result.success) {
            set({ 
              user: { ...user, ...updates, updatedAt: new Date() }, 
              isLoading: false, 
              error: null 
            });
            return { success: true };
          } else {
            set({ isLoading: false, error: result.error });
            return { success: false, error: result.error };
          }
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          return { success: false, error: error.message };
        }
      },

      clearError: () => set({ error: null }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'firebase-auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

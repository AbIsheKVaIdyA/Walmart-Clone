import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserWithoutPassword, AuthResponse } from "@/typings/authTypings";

interface AuthState {
  user: UserWithoutPassword | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (authData: AuthResponse) => void;
  clearAuth: () => void;
  setUser: (user: UserWithoutPassword) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (authData) =>
        set({
          user: authData.user,
          accessToken: authData.accessToken,
          refreshToken: authData.refreshToken,
          isAuthenticated: true,
        }),
      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
      setUser: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),
    }),
    {
      name: "auth-storage",
    }
  )
);



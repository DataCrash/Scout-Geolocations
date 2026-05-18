import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthRole } from "@/lib/schemas/authApiSchemas";

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  role: AuthRole;
}

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      logout: () => set({ user: null, token: null, error: null }),

      isAuthenticated: () => {
        const { token } = get();
        return !!token;
      },
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    },
  ),
);

/**
 * Get authorization header for API requests
 */
export function getAuthHeader(): Record<string, string> {
  const { token } = useAuthStore.getState();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

/**
 * Fetch with authentication
 */
export async function authenticatedFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const headers = {
    ...getAuthHeader(),
    ...(init?.headers as Record<string, string>),
  };

  return fetch(url, {
    ...init,
    headers,
  });
}

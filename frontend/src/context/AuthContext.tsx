import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import * as api from "../api/endpoints";
import { setAuthToken } from "../api/client";
import type { UserResponse } from "../api/types";

const TOKEN_STORAGE_KEY = "masteacon_access_token";
const LEGACY_TOKEN_STORAGE_KEY = "aika_access_token";

function readStoredToken(): string | null {
  const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (stored) return stored;

  const legacyStored = localStorage.getItem(LEGACY_TOKEN_STORAGE_KEY);

  if (legacyStored) {
    localStorage.setItem(TOKEN_STORAGE_KEY, legacyStored);
    localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
    return legacyStored;
  }

  return null;
}

interface AuthContextValue {
  user: UserResponse | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    website?: string,
    turnstileToken?: string,
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = readStoredToken();
    if (!storedToken) {
      setIsLoading(false);
      return;
    }
    setAuthToken(storedToken);
    api
      .getCurrentUser()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setAuthToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const applyToken = useCallback(async (token: string) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    setAuthToken(token);
    const currentUser = await api.getCurrentUser();
    setUser(currentUser);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { access_token } = await api.login(email, password);
      await applyToken(access_token);
    },
    [applyToken],
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      website = "",
      turnstileToken = "",
    ) => {
      await api.register(
        email,
        password,
        website,
        turnstileToken,
      );

      // Registration does not start an authenticated browser session.
      // The user must verify their email before continuing.
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
    setAuthToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

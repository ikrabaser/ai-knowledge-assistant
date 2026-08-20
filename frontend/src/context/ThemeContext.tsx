import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type ThemeMode = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "masteacon_theme_mode";
const LEGACY_THEME_STORAGE_KEY = "aika_theme_mode";

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedTheme: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

function readStoredTheme(): ThemeMode {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);

  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }

  const legacyStored = localStorage.getItem(LEGACY_THEME_STORAGE_KEY);

  if (
    legacyStored === "light" ||
    legacyStored === "dark" ||
    legacyStored === "system"
  ) {
    localStorage.setItem(THEME_STORAGE_KEY, legacyStored);
    localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
    return legacyStored;
  }

  return "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => resolveTheme(mode));

  useEffect(() => {
    const resolved = resolveTheme(mode);
    setResolvedTheme(resolved);
    document.documentElement.setAttribute("data-theme", resolved);
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    if (mode !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const resolved = resolveTheme("system");
      setResolvedTheme(resolved);
      document.documentElement.setAttribute("data-theme", resolved);
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => setModeState(next), []);

  return <ThemeContext.Provider value={{ mode, resolvedTheme, setMode }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}

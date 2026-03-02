"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type AestheticThemeId = "classic" | "liquidGlass" | "midnightGlass" | "paper";

const STORAGE_KEY = "klyr-aesthetic-theme";
const DEFAULT_THEME: AestheticThemeId = "classic";

type ContextValue = {
  theme: AestheticThemeId;
  setTheme: (id: AestheticThemeId) => void;
};

const AestheticThemeContext = createContext<ContextValue | null>(null);

export function useAestheticTheme(): ContextValue {
  const ctx = useContext(AestheticThemeContext);
  if (!ctx) throw new Error("useAestheticTheme must be used within AestheticThemeProvider");
  return ctx;
}

export function AestheticThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AestheticThemeId>(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const id = raw as AestheticThemeId;
        if (["classic", "liquidGlass", "midnightGlass", "paper"].includes(id)) {
          setThemeState(id);
        }
      }
    } catch {
      // ignore
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme, mounted]);

  const setTheme = useCallback((id: AestheticThemeId) => {
    setThemeState(id);
  }, []);

  return (
    <AestheticThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </AestheticThemeContext.Provider>
  );
}

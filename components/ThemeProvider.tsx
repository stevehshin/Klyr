"use client";

import { useEffect } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem("klyr-theme");
    if (savedTheme) {
      try {
        const theme = JSON.parse(savedTheme);
        const root = document.documentElement;
        root.style.setProperty("--color-primary", theme.primaryColor);
        root.style.setProperty("--color-accent", theme.accentColor);
        root.style.setProperty("--color-bg", theme.backgroundColor);
        root.style.setProperty("--color-text", theme.textColor);
        root.style.setProperty("--border-radius", theme.borderRadius);
        root.style.setProperty("--font-family", theme.fontFamily);
      } catch (error) {
        console.error("Failed to load theme:", error);
      }
    }
  }, []);

  return <>{children}</>;
}

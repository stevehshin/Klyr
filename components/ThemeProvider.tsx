"use client";

import { useEffect } from "react";
import { AestheticThemeProvider } from "@/context/AestheticThemeContext";
import { syncEncryptionKeyFromProfile } from "@/lib/crypto";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Sync encryption key from profile so messages sent from another device can be decrypted
    syncEncryptionKeyFromProfile();
  }, []);

  useEffect(() => {
    // Load custom theme from localStorage on mount (existing behavior)
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

  return <AestheticThemeProvider>{children}</AestheticThemeProvider>;
}

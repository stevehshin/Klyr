"use client";

import { useState, useRef, useEffect } from "react";
import { useAestheticTheme } from "@/context/AestheticThemeContext";
import type { AestheticThemeId } from "@/context/AestheticThemeContext";

const THEMES: { id: AestheticThemeId; label: string; icon: string }[] = [
  { id: "classic", label: "Classic", icon: "◻" },
  { id: "liquidGlass", label: "Liquid Glass", icon: "◇" },
  { id: "midnightGlass", label: "Midnight Glass", icon: "◆" },
  { id: "paper", label: "Paper", icon: "▢" },
];

export interface ThemeSwitcherProps {
  /** "top" = popover below (for header); "bottom" = popover above (for dock) */
  placement?: "top" | "bottom";
  /** Optional class for the trigger button */
  buttonClassName?: string;
  /** Show divider before the button (e.g. in dock) */
  showDivider?: boolean;
}

export function ThemeSwitcher({
  placement = "top",
  buttonClassName = "",
  showDivider = false,
}: ThemeSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useAestheticTheme();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      {showDivider && <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" aria-hidden />}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={
          buttonClassName ||
          "min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-colors duration-200"
        }
        aria-label="Change theme"
        aria-expanded={open}
        aria-haspopup="true"
        title="Theme"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343L12.657 6h2.343M11 7.343v4.314M11 7.343H7.657" />
        </svg>
      </button>
      {open && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 py-2 min-w-[180px] rounded-xl border shadow-xl z-[100] bg-white dark:bg-gray-800 border-gray-200/80 dark:border-gray-700 ${
            placement === "top" ? "top-full mt-1" : "bottom-full mb-2"
          }`}
          role="menu"
          aria-label="Theme options"
        >
          <div className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Theme
          </div>
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="menuitem"
              onClick={() => {
                setTheme(t.id);
                setOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 rounded-lg transition-colors hover:opacity-90 ${theme === t.id ? "font-medium" : ""}`}
              style={{ color: theme === t.id ? "var(--color-accent)" : undefined }}
            >
              <span className="opacity-70">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

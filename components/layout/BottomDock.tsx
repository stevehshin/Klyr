"use client";

import { useState, useRef, useEffect } from "react";
import { useAestheticTheme } from "@/context/AestheticThemeContext";

const THEMES = [
  { id: "classic", label: "Classic", icon: "◻" },
  { id: "liquidGlass", label: "Liquid Glass", icon: "◇" },
  { id: "midnightGlass", label: "Midnight Glass", icon: "◆" },
  { id: "paper", label: "Paper", icon: "▢" },
] as const;

export function BottomDock() {
  const { theme, setTheme } = useAestheticTheme();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    };
    if (popoverOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverOpen]);

  return (
    <footer
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      aria-hidden="true"
    >
      <div
        className="pointer-events-auto flex items-center gap-1 px-3 py-2 rounded-2xl border shadow-lg max-w-[calc(100vw-2rem)]"
        style={{
          background: "var(--k-dock-bg, rgba(255,255,255,0.8))",
          borderColor: "var(--k-dock-border, rgba(0,0,0,0.06))",
          backdropFilter: "var(--k-blur) blur(12px)",
          WebkitBackdropFilter: "var(--k-blur) blur(12px)",
        }}
        role="toolbar"
        aria-label="App dock"
      >
        {/* Minimized items (visual only) */}
        <div
          className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 rounded-xl text-gray-400 dark:text-gray-500"
          aria-label="Minimized items"
          title="Coming soon"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </div>

        {/* Notifications (visual only) */}
        <button
          type="button"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:opacity-80 transition-opacity cursor-default"
          aria-label="Notifications"
          title="Coming soon"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        {/* Search / Lens (visual only) */}
        <button
          type="button"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:opacity-80 transition-opacity cursor-default"
          aria-label="Search"
          title="Coming soon"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        {/* Quick add (visual only) */}
        <button
          type="button"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:opacity-80 transition-opacity cursor-default"
          aria-label="Quick add"
          title="Coming soon"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* Theme toggle (functional) */}
        <div className="relative" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setPopoverOpen((o) => !o)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 rounded-xl transition-colors hover:opacity-90"
            style={{ color: "var(--k-accent, #2563eb)" }}
            aria-label="Change theme"
            aria-expanded={popoverOpen}
            aria-haspopup="true"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343L12.657 6h2.343M11 7.343v4.314M11 7.343H7.657" />
            </svg>
          </button>

          {popoverOpen && (
            <div
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 py-2 min-w-[180px] rounded-xl border shadow-xl z-[100]"
              style={{
                background: "var(--k-dock-bg, #fff)",
                borderColor: "var(--k-dock-border, rgba(0,0,0,0.08))",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
              role="menu"
              aria-label="Theme options"
            >
              <div className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider opacity-70" style={{ color: "var(--k-muted)" }}>
                Theme
              </div>
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setTheme(t.id);
                    setPopoverOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 rounded-lg transition-colors hover:opacity-90 ${theme === t.id ? "font-medium" : ""}`}
                  style={{
                    color: "var(--k-text)",
                    background: "transparent",
                  }}
                >
                  <span className="opacity-70">{t.icon}</span>
                  <span style={{ color: theme === t.id ? "var(--k-accent)" : "inherit" }}>{t.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

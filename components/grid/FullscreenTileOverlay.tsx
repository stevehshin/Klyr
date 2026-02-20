"use client";

import { type ReactNode } from "react";

export interface FullscreenTileOverlayProps {
  title: string;
  onBack: () => void;
  onHide?: () => void;
  onMinimizeToDock?: () => void;
  children: ReactNode;
}

export function FullscreenTileOverlay({
  title,
  onBack,
  onHide,
  onMinimizeToDock,
  children,
}: FullscreenTileOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-[var(--background)]"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Header */}
      <header
        className="flex-shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-gray-200/60 dark:border-white/5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md min-h-[52px]"
        style={{ transition: "border-color var(--motion-duration) var(--motion-ease)" }}
      >
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 -ml-1 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Back"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="flex-1 min-w-0 truncate text-[15px] font-medium text-gray-900 dark:text-white">
          {title}
        </h1>
        {onMinimizeToDock && (
          <button
            type="button"
            onClick={onMinimizeToDock}
            className="min-h-[44px] px-3 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Minimize to Dock"
          >
            Minimize
          </button>
        )}
        {onHide && (
          <button
            type="button"
            onClick={onHide}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            aria-label="Hide tile"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </header>

      {/* Scrollable content — single scroll container to avoid nested scroll */}
      <div className="flex-1 min-h-0 overflow-auto">
        {children}
      </div>
    </div>
  );
}

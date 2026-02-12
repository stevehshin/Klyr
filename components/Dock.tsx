"use client";

import { useState } from "react";

export interface LoopBarProps {
  tileId: string;
  roomLabel: string;
  muted: boolean;
  onMuteToggle: () => void;
  onLeave: () => void;
  onFocus: () => void;
}

export interface DockProps {
  /** Minimized tile ids to show as icons; map id -> label for tooltip */
  minimizedTiles?: { id: string; label: string }[];
  onRestoreTile?: (id: string) => void;
  onOpenLens?: () => void;
  onOpenFlux?: () => void;
  onOpenQuickJot?: () => void;
  onOpenNotifications?: () => void;
  /** Active tile label for "Active: &lt;label&gt;" chip; click focuses tile */
  activeTileLabel?: string;
  onFocusActiveTile?: () => void;
  /** When user is in a Loop room, show Loop bar (room name, mute, leave) */
  loopBar?: LoopBarProps;
}

export function Dock({
  minimizedTiles = [],
  onRestoreTile,
  onOpenLens,
  onOpenFlux,
  onOpenQuickJot,
  onOpenNotifications,
  activeTileLabel,
  onFocusActiveTile,
  loopBar,
}: DockProps) {
  const [quickJotFocused, setQuickJotFocused] = useState(false);

  return (
    <div
      className="klyr-dock fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 px-2 sm:px-3 py-2 rounded-2xl bg-white/80 dark:bg-gray-900/80 border border-gray-200/60 dark:border-white/10 backdrop-blur-xl max-w-[calc(100vw-2rem)] pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      role="toolbar"
      aria-label="Global dock"
    >
      {onOpenNotifications && (
        <button
          onClick={onOpenNotifications}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-colors duration-200"
          aria-label="Notifications"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
      )}

      {onOpenLens && (
        <button
          onClick={onOpenLens}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-colors duration-200"
          aria-label="Search (Lens)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      )}

      {onOpenFlux && (
        <button
          onClick={onOpenFlux}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-500/10 transition-colors duration-200 flux-shimmer"
          aria-label="Flux — AI Assistant"
          title="Flux"
        >
          <span className="text-lg" aria-hidden>✨</span>
        </button>
      )}

      {onOpenQuickJot && (
        <button
          onClick={() => setQuickJotFocused(true)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-colors duration-200"
          aria-label="Quick Jot"
          title="Quick note or task"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {loopBar && (
        <>
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" aria-hidden />
          <div className="flex items-center gap-1 rounded-xl bg-primary-500/10 dark:bg-primary-500/20 px-2 py-1.5">
            <button
              type="button"
              onClick={loopBar.onFocus}
              className="text-xs font-medium text-primary-700 dark:text-primary-300 truncate max-w-[100px] hover:underline"
              title={`Loop: ${loopBar.roomLabel} — click to focus`}
            >
              🎙 {loopBar.roomLabel}
            </button>
            <button
              type="button"
              onClick={loopBar.onMuteToggle}
              className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200/80 dark:hover:bg-gray-700/80"
              title={loopBar.muted ? "Unmute" : "Mute"}
            >
              {loopBar.muted ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
              )}
            </button>
            <button
              type="button"
              onClick={loopBar.onLeave}
              className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
              title="Leave room"
            >
              Leave
            </button>
          </div>
        </>
      )}
      {activeTileLabel && onFocusActiveTile && (
        <>
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" aria-hidden />
          <button
            type="button"
            onClick={onFocusActiveTile}
            className="min-h-[44px] px-2.5 py-1.5 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-colors duration-200 flex items-center gap-1.5"
            title={`Active: ${activeTileLabel} — click to focus`}
          >
            <span className="opacity-70">Active:</span>
            <span className="truncate max-w-[80px]">{activeTileLabel}</span>
          </button>
        </>
      )}
      {minimizedTiles.length > 0 && (
        <>
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" aria-hidden />
          {minimizedTiles.map((t) => (
            <button
              key={t.id}
              onClick={() => onRestoreTile?.(t.id)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-colors duration-200"
              title={t.label}
            >
              <span className="text-sm font-medium w-6 h-6 flex items-center justify-center rounded bg-gray-200 dark:bg-gray-700">
                {t.label.charAt(0)}
              </span>
            </button>
          ))}
        </>
      )}

      {quickJotFocused && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-24 bg-black/20 backdrop-blur-sm" onClick={() => setQuickJotFocused(false)}>
          <div
            className="w-full max-w-md rounded-xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick Jot — coming soon</p>
            <input
              type="text"
              placeholder="Note or task..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-transparent text-gray-900 dark:text-white placeholder-gray-400"
              autoFocus
            />
            <div className="mt-2 flex justify-end gap-2">
              <button onClick={() => setQuickJotFocused(false)} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-400">Cancel</button>
              <button onClick={() => setQuickJotFocused(false)} className="text-sm text-primary-600 dark:text-primary-400 font-medium">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

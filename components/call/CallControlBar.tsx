"use client";

import { useEffect, useCallback } from "react";

export function CallControlBar({
  muted,
  videoOff,
  screenSharing,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onLeave,
}: {
  muted: boolean;
  videoOff: boolean;
  screenSharing: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onLeave: () => void;
}) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === "m") {
        e.preventDefault();
        onToggleMute();
      } else if (key === "v") {
        e.preventDefault();
        onToggleVideo();
      } else if (key === "s") {
        e.preventDefault();
        onToggleScreenShare();
      } else if (key === "l") {
        e.preventDefault();
        onLeave();
      }
    },
    [onToggleMute, onToggleVideo, onToggleScreenShare, onLeave]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const btnClass = "p-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--call-accent)]";

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-full bg-[var(--call-surface)]/90 border border-[var(--call-border)] shadow-lg"
      role="toolbar"
      aria-label="Call controls"
    >
      <button
        type="button"
        onClick={onToggleMute}
        className={`${btnClass} ${muted ? "bg-[var(--call-error)] text-white" : "bg-[var(--call-surface)] text-[var(--call-text)]"}`}
        aria-pressed={muted}
        aria-label={muted ? "Unmute (M)" : "Mute (M)"}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onToggleVideo}
        className={`${btnClass} ${videoOff ? "bg-[var(--call-error)] text-white" : "bg-[var(--call-surface)] text-[var(--call-text)]"}`}
        aria-pressed={videoOff}
        aria-label={videoOff ? "Camera on (V)" : "Camera off (V)"}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onToggleScreenShare}
        className={`${btnClass} ${screenSharing ? "bg-[var(--call-accent)] text-white" : "bg-[var(--call-surface)] text-[var(--call-text)]"}`}
        aria-pressed={screenSharing}
        aria-label={screenSharing ? "Stop share (S)" : "Share screen (S)"}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z" />
        </svg>
      </button>
      <div className="w-px h-6 bg-[var(--call-border)]" />
      <button
        type="button"
        onClick={onLeave}
        className={`${btnClass} bg-[var(--call-error)] text-white hover:opacity-90`}
        aria-label="Leave call (L)"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.996.996 0 010-1.41l3.86-3.86c.18-.18.43-.29.71-.29.27 0 .52.11.7.28.79.74 1.68 1.37 2.66 1.85.33.16.56.5.56.9v3.27C15.54 14.12 18 16 18 16s-3 0-6-7z" />
        </svg>
      </button>
    </div>
  );
}

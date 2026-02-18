"use client";

import { useState, useEffect, useCallback } from "react";
import { openCallInNewWindow } from "@/lib/call/open-call-window";

const LOOP_JOINED_KEY = "klyr-loop-joined";

export interface LoopRoomTileProps {
  tileId: string;
  roomLabel: string;
  userEmail?: string;
  onClose: () => void;
}

export function LoopRoomTile({ tileId, roomLabel, userEmail, onClose }: LoopRoomTileProps) {
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOOP_JOINED_KEY);
      const ids: string[] = raw ? JSON.parse(raw) : [];
      setJoined(ids.includes(tileId));
    } catch {
      setJoined(false);
    }
  }, [tileId]);

  const handleLeave = useCallback(() => {
    setJoined(false);
    setMuted(false);
    try {
      const raw = localStorage.getItem(LOOP_JOINED_KEY);
      const ids: Array<string> = raw ? JSON.parse(raw) : [];
      localStorage.setItem(LOOP_JOINED_KEY, JSON.stringify(ids.filter((id) => id !== tileId)));
    } catch {}
    window.dispatchEvent(new CustomEvent("klyr-loop-left", { detail: { tileId, roomLabel } }));
  }, [tileId, roomLabel]);

  useEffect(() => {
    const onLeft = (e: Event) => {
      const d = (e as CustomEvent).detail as { tileId: string };
      if (d.tileId === tileId) handleLeave();
    };
    const onMute = (e: Event) => {
      const d = (e as CustomEvent).detail as { tileId: string };
      if (d.tileId === tileId)
        setMuted((m) => {
          const next = !m;
          window.dispatchEvent(
            new CustomEvent("klyr-loop-mute-state", { detail: { tileId, muted: next } })
          );
          return next;
        });
    };
    window.addEventListener("klyr-loop-left", onLeft);
    window.addEventListener("klyr-loop-mute", onMute);
    return () => {
      window.removeEventListener("klyr-loop-left", onLeft);
      window.removeEventListener("klyr-loop-mute", onMute);
    };
  }, [tileId, handleLeave]);

  const handleJoin = () => {
    openCallInNewWindow(tileId, roomLabel, userEmail, { audioOnly: true, loopRoom: true });
    setJoined(true);
    try {
      const raw = localStorage.getItem(LOOP_JOINED_KEY);
      const ids: string[] = raw ? JSON.parse(raw) : [];
      if (!ids.includes(tileId)) {
        localStorage.setItem(LOOP_JOINED_KEY, JSON.stringify([...ids, tileId]));
      }
    } catch {}
    window.dispatchEvent(new CustomEvent("klyr-loop-joined", { detail: { tileId, roomLabel } }));
  };

  return (
    <div className="h-full flex flex-col rounded-lg overflow-hidden bg-transparent">
      <div className="tile-header flex items-center justify-between px-4 py-3 border-b border-gray-200/60 dark:border-gray-700/80 cursor-move bg-gray-50/80 dark:bg-gray-900/80 rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden>🎙</span>
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{roomLabel}</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">Voice</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          aria-label="Close tile"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center gap-4">
        {!joined ? (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Join to talk. No auto-join — you choose when to enter.
            </p>
            <button
              onClick={handleJoin}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              Join room
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You&apos;re in the room. Use the dock to mute or leave.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setMuted((m) => { const next = !m; window.dispatchEvent(new CustomEvent("klyr-loop-mute-state", { detail: { tileId, muted: next } })); return next; })}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${muted ? "bg-red-500/20 text-red-600 dark:text-red-400" : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"}`}
              >
                {muted ? "Unmute" : "Mute"}
              </button>
              <button
                onClick={handleLeave}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
              >
                Leave
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Voice in the call window. Use the dock to mute or leave.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

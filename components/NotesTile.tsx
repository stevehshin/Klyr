"use client";

import { useState, useEffect, useCallback } from "react";

export interface NotesTileProps {
  tileId: string;
  onClose: () => void;
}

export function NotesTile({ tileId, onClose }: NotesTileProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(`/api/tiles/${tileId}/notes`, {
        credentials: "include",
        signal: ctrl.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load notes");
      setContent(data.content ?? "");
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.name === "AbortError"
            ? "Request timed out. Check your connection."
            : e.message
          : "Failed to load notes";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [tileId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Debounced save to API (shared with everyone on grid)
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      fetch(`/api/tiles/${tileId}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      }).catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [content, tileId, loading]);

  return (
    <div className="h-full flex flex-col rounded-lg overflow-hidden bg-transparent">
      <div className="tile-header flex items-center justify-between px-4 py-3 border-b border-gray-200/60 dark:border-gray-700/80 cursor-move bg-gray-50/80 dark:bg-gray-900/80 rounded-t-lg">
        <h3 className="font-semibold text-gray-900 dark:text-white">Notes</h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          aria-label="Close tile"
          title="Close"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="flex-1 p-4">
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</p>
        )}
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full resize-none border-none outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="Start typing your notes… (shared with everyone on this grid)"
            aria-label="Notes content"
          />
        )}
      </div>
    </div>
  );
}

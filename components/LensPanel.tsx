"use client";

import { useState, useMemo } from "react";
import { getTileLabel } from "@/lib/tileLabels";
import type { TileData } from "@/components/Grid";

export interface LensPanelProps {
  gridName: string;
  tiles: TileData[];
  onClose: () => void;
  onFocusTile: (tileId: string) => void;
}

export function LensPanel({ gridName, tiles, onClose, onFocusTile }: LensPanelProps) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tiles.slice(0, 20);
    return tiles.filter((t) => {
      const label = getTileLabel(t.type, t.channelName ?? t.conversationName ?? t.roomLabel ?? undefined);
      return label.toLowerCase().includes(q) || t.type.toLowerCase().includes(q);
    });
  }, [tiles, query]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search tiles in ${gridName}...`}
            className="flex-1 min-w-0 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none"
            autoFocus
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto py-2">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400 text-center">
              {query.trim() ? "No tiles match your search." : "Type to search tiles."}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {results.map((tile) => {
                const label = getTileLabel(tile.type, tile.channelName ?? tile.conversationName ?? tile.roomLabel ?? undefined);
                return (
                  <li key={tile.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onFocusTile(tile.id);
                        onClose();
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-3"
                    >
                      <span className="text-gray-400 dark:text-gray-500 font-medium w-8">{tile.type}</span>
                      <span className="truncate">{label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

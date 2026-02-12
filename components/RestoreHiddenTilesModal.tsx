"use client";

import { useState, useEffect } from "react";

export interface HiddenTile {
  id: string;
  type: string;
  channelId?: string;
  channelName?: string;
  channelEmoji?: string;
  conversationId?: string;
  roomLabel?: string;
}

export interface RestoreHiddenTilesModalProps {
  gridId: string;
  onClose: () => void;
  onRestored: (tiles: any[]) => void;
  onDeleted: (tileIds: string[]) => void;
}

function getTileLabel(tile: HiddenTile): string {
  switch (tile.type) {
    case "notes":
      return "📝 Notes";
    case "tasks":
      return "✅ Tasks";
    case "links":
      return "🔗 Links";
    case "calendar":
      return "📅 Calendar";
    case "channel":
      return `${tile.channelEmoji || "📢"} #${tile.channelName || "Channel"}`;
    case "dm":
      return `💬 DM ${tile.conversationId?.slice(0, 8) || ""}`;
    case "call":
      return `📹 ${tile.roomLabel || "Call"}`;
    case "summary":
      return "✨ Daily Summary";
    default:
      return `${tile.type}`;
  }
}

export function RestoreHiddenTilesModal({
  gridId,
  onClose,
  onRestored,
  onDeleted,
}: RestoreHiddenTilesModalProps) {
  const [tiles, setTiles] = useState<HiddenTile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchHidden = async () => {
      try {
        const res = await fetch(`/api/tiles/hidden?gridId=${encodeURIComponent(gridId)}`);
        if (res.ok) {
          const data = await res.json();
          setTiles(data.tiles || []);
          setSelected(new Set((data.tiles || []).map((t: HiddenTile) => t.id)));
        }
      } catch (err) {
        console.error("Failed to fetch hidden tiles:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHidden();
  }, [gridId]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(tiles.map((t) => t.id)));
  const selectNone = () => setSelected(new Set());

  const handleRestore = async (tileIds?: string[]) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/tiles/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gridId,
          tileIds: tileIds ?? Array.from(selected),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onRestored(data.tiles || []);
        const restoredIds = (data.tiles || []).map((t: { id: string }) => t.id);
        setTiles((prev) => prev.filter((t) => !restoredIds.includes(t.id)));
        setSelected((prev) => {
          const next = new Set(prev);
          restoredIds.forEach((id: string) => next.delete(id));
          return next;
        });
      }
    } catch (err) {
      console.error("Failed to restore:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (tileIds: string[]) => {
    if (tileIds.length === 0) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/tiles/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tileIds }),
      });
      if (res.ok) {
        onDeleted(tileIds);
        setTiles((prev) => prev.filter((t) => !tileIds.includes(t.id)));
        setSelected((prev) => {
          const next = new Set(prev);
          tileIds.forEach((id) => next.delete(id));
          return next;
        });
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreSelected = () => handleRestore(Array.from(selected));
  const handleRestoreAll = () => handleRestore(tiles.map((t) => t.id));
  const handleDeleteSelected = () => handleDelete(Array.from(selected));
  const handleDeleteAll = () => handleDelete(tiles.map((t) => t.id));

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl px-6 py-8 min-w-[320px] text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading hidden tiles…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Hidden Tiles ({tiles.length})
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-400 rounded"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {tiles.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
            No hidden tiles
          </div>
        ) : (
          <>
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Select all
              </button>
              <span className="text-gray-400">|</span>
              <button
                type="button"
                onClick={selectNone}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Select none
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {tiles.map((tile) => (
                <label
                  key={tile.id}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(tile.id)}
                    onChange={() => toggle(tile.id)}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-gray-900 dark:text-white">{getTileLabel(tile)}</span>
                </label>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
              <button
                onClick={handleRestoreSelected}
                disabled={actionLoading || selected.size === 0}
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Restore selected ({selected.size})
              </button>
              <button
                onClick={handleRestoreAll}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                Restore all
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={actionLoading || selected.size === 0}
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Delete selected ({selected.size})
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                Delete all
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { TileData } from "@/components/Grid";

export interface QuickJotModalProps {
  gridId: string;
  tiles: TileData[];
  onClose: () => void;
  onAdded: () => void;
}

type JotType = "note" | "task";

export function QuickJotModal({ gridId, tiles, onClose, onAdded }: QuickJotModalProps) {
  const [content, setContent] = useState("");
  const [type, setType] = useState<JotType>("note");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notesTile = tiles.find((t) => t.type === "notes");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    try {
      if (type === "note") {
        let tileId = notesTile?.id;
        if (!tileId) {
          const createRes = await fetch("/api/tiles/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ gridId, type: "notes" }),
            credentials: "include",
          });
          if (!createRes.ok) {
            const data = await createRes.json().catch(() => ({}));
            throw new Error(data.error ?? "Failed to create Notes tile");
          }
          const data = await createRes.json();
          tileId = data.tile?.id;
          if (!tileId) throw new Error("No tile ID returned");
        }
        const existingContent = notesTile
          ? await (async () => {
              const r = await fetch(`/api/tiles/${tileId}/notes`, { credentials: "include" });
              if (!r.ok) return "";
              const d = await r.json();
              return (d.content as string) ?? "";
            })()
          : "";
        const newContent = existingContent ? `${existingContent}\n${trimmed}` : trimmed;
        const putRes = await fetch(`/api/tiles/${tileId}/notes`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newContent }),
          credentials: "include",
        });
        if (!putRes.ok) throw new Error("Failed to save note");
        onAdded();
      } else {
        const taskRes = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gridId,
            title: trimmed.slice(0, 500),
            status: "TODO",
            visibility: "SHARED",
          }),
          credentials: "include",
        });
        if (!taskRes.ok) {
          const data = await taskRes.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to create task");
        }
        onAdded();
      }
      setContent("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-24 bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-900 dark:text-white">Quick Jot</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("note")}
              className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${type === "note" ? "bg-primary-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
            >
              Note
            </button>
            <button
              type="button"
              onClick={() => setType("task")}
              className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${type === "task" ? "bg-primary-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
            >
              Task
            </button>
          </div>
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={type === "note" ? "Add a note..." : "Add a task..."}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 text-sm"
            autoFocus
          />
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !content.trim()}
              className="px-4 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? "Adding…" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

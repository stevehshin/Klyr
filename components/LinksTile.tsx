"use client";

import { useState, useEffect, useCallback } from "react";

export interface LinksTileProps {
  tileId: string;
  onClose: () => void;
}

interface Link {
  id: string;
  title: string;
  url: string;
}

export function LinksTile({ tileId, onClose }: LinksTileProps) {
  const [links, setLinks] = useState<Link[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tiles/${tileId}/links`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load links");
      setLinks(data.links ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load links");
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, [tileId]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const addLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;
    const url = newUrl.startsWith("http") ? newUrl : `https://${newUrl}`;
    try {
      const res = await fetch(`/api/tiles/${tileId}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add link");
      setNewTitle("");
      setNewUrl("");
      setLinks((prev) => [...prev, { id: data.link.id, title: data.link.title, url: data.link.url }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add link");
    }
  };

  const deleteLink = async (id: string) => {
    try {
      const res = await fetch(`/api/tiles/${tileId}/links?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setLinks((prev) => prev.filter((l) => l.id !== id));
    } catch {
      setError("Failed to delete link");
    }
  };

  return (
    <div className="h-full flex flex-col rounded-lg overflow-hidden bg-transparent">
      <div className="tile-header flex items-center justify-between px-4 py-3 border-b border-gray-200/60 dark:border-gray-700/80 cursor-move bg-gray-50/80 dark:bg-gray-900/80 rounded-t-lg">
        <h3 className="font-semibold text-gray-900 dark:text-white">Links</h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          aria-label="Close tile"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</p>
        )}
        <form onSubmit={addLink} className="mb-4 space-y-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Link title..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
        </form>

        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
        ) : (
          <>
            <div className="space-y-2">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 group"
                >
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline truncate"
                    >
                      {link.title}
                    </a>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{link.url}</p>
                  </div>
                  <button
                    onClick={() => deleteLink(link.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity flex-shrink-0"
                    aria-label="Delete link"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            {links.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-8">
                No links yet. Add one above! (Shared with everyone on this grid.)
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { decryptMessage } from "@/lib/crypto";
import { getStoredOpenAIKey } from "@/lib/settings";

export interface SummaryTileProps {
  tileId: string;
  gridId: string;
  onClose: () => void;
}

interface GridTile {
  id: string;
  type: string;
  channelId?: string | null;
  conversationId?: string | null;
}

const since24h = () => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

async function gatherGridContent(gridId: string): Promise<string> {
  const res = await fetch(`/api/grid/${gridId}`);
  if (!res.ok) return "";
  const { grid } = await res.json();
  const tiles: GridTile[] = grid?.tiles ?? [];
  const parts: string[] = [];

  for (const tile of tiles) {
    if (tile.type === "notes") {
      const raw = typeof localStorage !== "undefined" ? localStorage.getItem(`klyr-notes-${tile.id}`) : null;
      if (raw?.trim()) parts.push(`[Notes]\n${raw}`);
    } else if (tile.type === "tasks") {
      const raw = typeof localStorage !== "undefined" ? localStorage.getItem(`klyr-tasks-${tile.id}`) : null;
      if (raw) {
        try {
          const tasks = JSON.parse(raw) as { text: string; completed: boolean }[];
          if (tasks?.length) {
            const list = tasks.map((t) => `${t.completed ? "[x]" : "[ ]"} ${t.text}`).join("\n");
            parts.push(`[Tasks]\n${list}`);
          }
        } catch {
          // ignore
        }
      }
    } else if (tile.type === "links") {
      const raw = typeof localStorage !== "undefined" ? localStorage.getItem(`klyr-links-${tile.id}`) : null;
      if (raw) {
        try {
          const links = JSON.parse(raw) as { title: string; url: string }[];
          if (links?.length) {
            const list = links.map((l) => `${l.title}: ${l.url}`).join("\n");
            parts.push(`[Links]\n${list}`);
          }
        } catch {
          // ignore
        }
      }
    } else if (tile.type === "dm") {
      try {
        const msgRes = await fetch(`/api/messages?tileId=${encodeURIComponent(tile.id)}`);
        if (!msgRes.ok) continue;
        const { messages } = await msgRes.json();
        const since = since24h();
        const recent = (messages ?? []).filter((m: { createdAt?: string }) => (m.createdAt || "") >= since);
        if (recent.length === 0) continue;
        const decrypted = await Promise.all(
          recent.map(async (m: { encryptedContent: string; createdAt?: string; user?: { email?: string } }) => {
            try {
              const text = await decryptMessage(m.encryptedContent);
              const who = m.user?.email?.split("@")[0] ?? "Someone";
              return `${m.createdAt ?? ""} ${who}: ${text}`;
            } catch {
              return null;
            }
          })
        );
        const lines = decrypted.filter(Boolean).join("\n");
        if (lines) parts.push(`[DM]\n${lines}`);
      } catch {
        // skip
      }
    } else if (tile.type === "channel" && tile.channelId) {
      try {
        const msgRes = await fetch(`/api/channels/${tile.channelId}/messages`);
        if (!msgRes.ok) continue;
        const { messages } = await msgRes.json();
        const since = since24h();
        const recent = (messages ?? []).filter((m: { createdAt?: string }) => (m.createdAt || "") >= since);
        if (recent.length === 0) continue;
        const decrypted = await Promise.all(
          recent.map(async (m: { encryptedContent: string; createdAt?: string; user?: { email?: string } }) => {
            try {
              const text = await decryptMessage(m.encryptedContent);
              const who = m.user?.email?.split("@")[0] ?? "Someone";
              return `${m.createdAt ?? ""} ${who}: ${text}`;
            } catch {
              return null;
            }
          })
        );
        const lines = decrypted.filter(Boolean).join("\n");
        if (lines) parts.push(`[Channel]\n${lines}`);
      } catch {
        // skip
      }
    }
  }

  if (parts.length === 0) return "No recent content in this grid (last 24 hours). Notes, tasks, and links are included in full.";
  return parts.join("\n\n---\n\n");
}

export function SummaryTile({ tileId, gridId, onClose }: SummaryTileProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const content = await gatherGridContent(gridId);
      const storedKey = getStoredOpenAIKey();
      const res = await fetch("/api/grid/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentForSummary: content,
          periodLabel: "the last 24 hours",
          ...(storedKey && storedKey.trim() ? { openaiApiKey: storedKey.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to generate summary");
        return;
      }
      setSummary(data.summary ?? "");
      setGeneratedAt(new Date().toISOString());
    } catch (e) {
      setError("Something went wrong");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col rounded-lg overflow-hidden bg-transparent">
      <div className="tile-header flex items-center justify-between px-4 py-3 border-b border-gray-200/60 dark:border-gray-700/80 cursor-move bg-gray-50/80 dark:bg-gray-900/80 rounded-t-lg">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="flux-shimmer" aria-hidden>✨</span> Flux
        </h3>
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
      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Summarize the last 24 hours?
        </p>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="self-start px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 transition-colors"
        >
          {loading ? "Generating…" : "Generate"}
        </button>
        {error && (
          <p className="mt-3 text-sm text-red-500 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        {generatedAt && (
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            Generated {new Date(generatedAt).toLocaleString()}
          </p>
        )}
        {summary && (
          <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700/80 text-sm text-gray-900 dark:text-white whitespace-pre-wrap animate-fade-in">
            {summary}
          </div>
        )}
      </div>
    </div>
  );
}

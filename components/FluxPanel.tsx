"use client";

import { useState, useEffect } from "react";
import { getStoredOpenAIKey } from "@/lib/settings";
import {
  gatherGridContent,
  getOverdueTasks,
  getFocusContent,
  suggestTilesForGrid,
  since24h,
  sinceYesterday,
  type TileSuggestion,
} from "@/lib/gridContent";

export interface FluxPanelProps {
  gridId: string;
  gridName: string;
  onClose: () => void;
  onOpenSettings: () => void;
}

type Action = "idle" | "summarize" | "overdue" | "suggest" | "changed" | "focus";

export function FluxPanel({
  gridId,
  gridName,
  onClose,
  onOpenSettings,
}: FluxPanelProps) {
  const [action, setAction] = useState<Action>("idle");
  const [output, setOutput] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<TileSuggestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasKey = typeof window !== "undefined" && !!getStoredOpenAIKey()?.trim();

  const runSummarize = async () => {
    setAction("summarize");
    setError(null);
    setOutput(null);
    if (!hasKey) {
      setError("Add an API key in Settings to enable Flux summaries.");
      setAction("idle");
      return;
    }
    try {
      const content = await gatherGridContent(gridId, since24h);
      const res = await fetch("/api/grid/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentForSummary: content,
          periodLabel: "the last 24 hours",
          openaiApiKey: getStoredOpenAIKey()?.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to generate summary");
        setAction("idle");
        return;
      }
      setOutput(data.summary ?? "");
    } catch (e) {
      setError("Something went wrong");
      console.error(e);
    }
    setAction("idle");
  };

  const runOverdue = async () => {
    setAction("overdue");
    setError(null);
    setOutput(null);
    try {
      const overdue = await getOverdueTasks(gridId);
      if (overdue.length === 0) {
        setOutput("Nothing overdue. All tasks with due dates are current.");
      } else {
        setOutput(
          overdue
            .map((t) => `• ${t.text} (due ${t.dueDate})`)
            .join("\n")
        );
      }
    } catch (e) {
      setError("Could not load tasks");
      console.error(e);
    }
    setAction("idle");
  };

  const runSuggest = async () => {
    setAction("suggest");
    setError(null);
    setOutput(null);
    setSuggestions(null);
    try {
      const list = await suggestTilesForGrid(gridId);
      setSuggestions(list);
      if (list.length === 0) setOutput("No suggestions — your grid is well rounded.");
    } catch (e) {
      setError("Could not load suggestions");
      console.error(e);
    }
    setAction("idle");
  };

  const runChanged = async () => {
    setAction("changed");
    setError(null);
    setOutput(null);
    if (!hasKey) {
      setError("Add an API key in Settings to enable Flux summaries.");
      setAction("idle");
      return;
    }
    try {
      const content = await gatherGridContent(gridId, sinceYesterday);
      const res = await fetch("/api/grid/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentForSummary: content,
          periodLabel: "since yesterday",
          openaiApiKey: getStoredOpenAIKey()?.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to generate summary");
        setAction("idle");
        return;
      }
      setOutput(data.summary ?? "");
    } catch (e) {
      setError("Something went wrong");
      console.error(e);
    }
    setAction("idle");
  };

  const runFocus = async () => {
    setAction("focus");
    setError(null);
    setOutput(null);
    if (!hasKey) {
      setError("Add an API key in Settings to enable Flux focus.");
      setAction("idle");
      return;
    }
    try {
      const content = await getFocusContent(gridId);
      const res = await fetch("/api/grid/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentForSummary: content,
          periodLabel: "focus",
          promptType: "focus",
          openaiApiKey: getStoredOpenAIKey()?.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to generate focus");
        setAction("idle");
        return;
      }
      setOutput(data.summary ?? "");
    } catch (e) {
      setError("Something went wrong");
      console.error(e);
    }
    setAction("idle");
  };

  const loading =
    action === "summarize" ||
    action === "overdue" ||
    action === "suggest" ||
    action === "changed" ||
    action === "focus";

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/15 dark:bg-black/25 backdrop-blur-[2px]"
        style={{
          opacity: mounted ? 1 : 0,
          transition: "opacity 220ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="presentation"
        aria-hidden
      />
      <div
        className="fixed z-50 left-4 right-4 sm:left-auto sm:right-6 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] sm:bottom-24 top-auto w-full max-w-[380px] max-h-[min(75vh,520px)] flex flex-col rounded-2xl bg-white/98 dark:bg-gray-900/98 border border-gray-200/70 dark:border-white/10 shadow-2xl shadow-black/10 dark:shadow-black/30 backdrop-blur-xl"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0) scale(1)" : "translateY(8px) scale(0.98)",
          transition: "opacity 220ms cubic-bezier(0.4, 0, 0.2, 1), transform 220ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        role="dialog"
        aria-labelledby="flux-title"
      >
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-200/60 dark:border-gray-700/80 rounded-t-2xl">
          <h2 id="flux-title" className="text-lg font-semibold text-gray-900 dark:text-white">
            Flux
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            aria-label="Close Flux"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {!hasKey && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-800 dark:text-amber-200">
            <p className="font-medium">API key needed</p>
            <p className="mt-1 text-amber-700 dark:text-amber-300/90">
              Add an API key in Settings to enable Flux summaries.
            </p>
            <button
              type="button"
              onClick={onOpenSettings}
              className="mt-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              Open Settings
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={runFocus}
            disabled={loading}
            className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 rounded-xl transition-colors disabled:opacity-50"
          >
            What should I focus on today?
          </button>
          <button
            type="button"
            onClick={runSummarize}
            disabled={loading}
            className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 rounded-xl transition-colors disabled:opacity-50"
          >
            Summarize this Grid (24h)
          </button>
          <button
            type="button"
            onClick={runOverdue}
            disabled={loading}
            className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 rounded-xl transition-colors disabled:opacity-50"
          >
            What&apos;s overdue?
          </button>
          <button
            type="button"
            onClick={runSuggest}
            disabled={loading}
            className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 rounded-xl transition-colors disabled:opacity-50"
          >
            Suggest tiles for this Grid
          </button>
          <button
            type="button"
            onClick={runChanged}
            disabled={loading}
            className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 rounded-xl transition-colors disabled:opacity-50"
          >
            What changed since yesterday?
          </button>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span
              className="inline-block w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"
              aria-hidden
            />
            <span>Loading…</span>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        {output && (
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/80 text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
            {output}
          </div>
        )}

        {suggestions && suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Suggestions
            </p>
            <ul className="space-y-2">
              {suggestions.map((s) => (
                <li
                  key={s.type}
                  className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/80 text-sm"
                >
                  <span className="font-medium text-gray-900 dark:text-white">
                    {s.label}
                  </span>
                  <p className="mt-1 text-gray-600 dark:text-gray-400">{s.reason}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

"use client";

import { useState } from "react";
import { addVeilRequest } from "@/lib/veil";

export interface RequestAccessModalProps {
  tileId: string;
  gridId: string;
  tileName: string;
  gridName: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export function RequestAccessModal({
  tileId,
  gridId,
  tileName,
  gridName,
  onClose,
  onSubmitted,
}: RequestAccessModalProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addVeilRequest(tileId, gridId, tileName, gridName, message.trim() || undefined);
    onSubmitted();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      role="dialog"
      aria-labelledby="request-access-title"
    >
      <div
        className="w-full max-w-md rounded-xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-200/60 dark:border-gray-700/80">
          <h2 id="request-access-title" className="text-lg font-semibold text-gray-900 dark:text-white">
            Request Access
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {tileName} · {gridName}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <label className="block">
            <span className="text-sm text-gray-600 dark:text-gray-400">Message (optional)</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Why you need access..."
              rows={3}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

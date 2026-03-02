"use client";

import { getNotificationsEnabled } from "@/lib/settings";

export interface NotificationsPanelProps {
  onClose: () => void;
  onOpenSettings: () => void;
}

export function NotificationsPanel({ onClose, onOpenSettings }: NotificationsPanelProps) {
  const enabled = typeof window !== "undefined" && getNotificationsEnabled();

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
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
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {enabled
              ? "You’ll see new DMs, mentions, and channel activity here when we have them."
              : "Enable notifications in Settings to get alerts for DMs, mentions, and more."}
          </p>
          <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No new notifications</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="w-full px-4 py-2.5 rounded-xl text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-500/10 border border-primary-500/30 dark:border-primary-400/30"
          >
            Notification preferences (Settings)
          </button>
        </div>
      </div>
    </div>
  );
}

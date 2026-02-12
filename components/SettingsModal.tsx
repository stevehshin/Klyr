"use client";

import { useState, useEffect } from "react";
import {
  getStoredOpenAIKey,
  setStoredOpenAIKey,
  getNotificationsEnabled,
  setNotificationsEnabled,
} from "@/lib/settings";

export interface SettingsModalProps {
  onClose: () => void;
  onOpenThemeCustomizer: () => void;
  userIsAdmin?: boolean;
}

export function SettingsModal({ onClose, onOpenThemeCustomizer, userIsAdmin }: SettingsModalProps) {
  const [openaiKey, setOpenaiKey] = useState("");
  const [notificationsEnabled, setNotificationsEnabledState] = useState(false);
  const [openaiKeySaved, setOpenaiKeySaved] = useState(false);

  useEffect(() => {
    setOpenaiKey(getStoredOpenAIKey() ?? "");
    setNotificationsEnabledState(getNotificationsEnabled());
  }, []);

  const handleSaveOpenAIKey = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredOpenAIKey(openaiKey || null);
    setOpenaiKeySaved(true);
    setTimeout(() => setOpenaiKeySaved(false), 2000);
  };

  const handleNotificationsToggle = () => {
    const next = !notificationsEnabled;
    setNotificationsEnabledState(next);
    setNotificationsEnabled(next);
  };

  const handleOpenTheme = () => {
    onClose();
    onOpenThemeCustomizer();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* API Keys */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              API keys
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Optional. If not set here, the server may use a configured environment key.
            </p>
            <form onSubmit={handleSaveOpenAIKey} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                OpenAI API key (for Daily Summary tile)
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  {openaiKeySaved ? "Saved" : "Save"}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Get a key at{" "}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  platform.openai.com/api-keys
                </a>
                . Stored in this browser only.
              </p>
            </form>
          </section>

          {/* Appearance */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Appearance
            </h3>
            <button
              type="button"
              onClick={handleOpenTheme}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              Customize theme
            </button>
          </section>

          {/* Notifications */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Notifications
            </h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={handleNotificationsToggle}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Enable browser notifications
              </span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Allow Klyr to show desktop notifications (e.g. new messages). You may need to allow notifications in your browser.
            </p>
          </section>

          {/* Admin */}
          {userIsAdmin && (
            <section>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Admin
              </h3>
              <a
                href="/admin"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Open Admin
              </a>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Manage users and view backend stats.
              </p>
            </section>
          )}

          {/* About */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              About
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-white">Klyr</strong> — Your workspace in one place. Grids, channels, DMs, and AI summaries.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

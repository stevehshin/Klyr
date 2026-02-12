"use client";

import { useState } from "react";

export interface ShareGridModalProps {
  gridId: string;
  gridName: string;
  onClose: () => void;
}

export function ShareGridModal({ gridId, gridName, onClose }: ShareGridModalProps) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"view" | "edit">("view");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/grid/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gridId, email, permission }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Grid shared with ${email}`);
        setEmail("");
        setTimeout(() => {
          setSuccess("");
        }, 3000);
      } else {
        setError(data.error || "Failed to share grid");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Share "{gridName}"
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleShare} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-400 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Permission Level
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                <input
                  type="radio"
                  name="permission"
                  value="view"
                  checked={permission === "view"}
                  onChange={(e) => setPermission(e.target.value as "view" | "edit")}
                  className="w-4 h-4 text-primary-600"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">View Only</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Can view tiles but not edit</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                <input
                  type="radio"
                  name="permission"
                  value="edit"
                  checked={permission === "edit"}
                  onChange={(e) => setPermission(e.target.value as "view" | "edit")}
                  className="w-4 h-4 text-primary-600"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Can Edit</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Can add, edit, and delete tiles</p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sharing..." : "Share Grid"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

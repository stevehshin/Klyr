"use client";

import { useState } from "react";

export function AdminClaimBootstrap({
  userId,
  userEmail,
}: {
  userId: string;
  userEmail: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClaim = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to claim admin");
      }
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto text-center py-12">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        No administrators yet
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Be the first to claim admin access. You’ll be able to manage users and view backend stats.
      </p>
      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <button
        type="button"
        onClick={handleClaim}
        disabled={loading}
        className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
      >
        {loading ? "…" : `Make ${userEmail} administrator`}
      </button>
    </div>
  );
}

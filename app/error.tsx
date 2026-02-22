"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  const isDatabaseError =
    error?.message?.includes("DATABASE_URL") ||
    error?.message?.includes("Can't reach database") ||
    error?.message?.includes("P1001") ||
    error?.message?.includes("connection");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Something went wrong
        </h1>
        {isDatabaseError ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            The app couldn’t connect to the database. If you’re the deployer, check that{" "}
            <strong>DATABASE_URL</strong> and <strong>DIRECT_URL</strong> are set in Vercel and
            that the database is reachable. Then run <code className="text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded">prisma db push</code> against production if needed.
          </p>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            A server-side error occurred. You can try again or go back to the home page.
          </p>
        )}
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Go home
          </Link>
        </div>
        {error?.digest && (
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}

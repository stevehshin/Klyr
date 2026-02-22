"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Something went wrong
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            A critical error occurred. Please try again.
          </p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Try again
          </button>
          {error?.digest && (
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}

"use client";

import { useEffect, useState } from "react";

export default function DebugEnvPage() {
  const [ping, setPing] = useState<Record<string, unknown> | null>(null);
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const run = async () => {
      const timeout = 12000;

      const ctrl1 = new AbortController();
      const t1 = setTimeout(() => ctrl1.abort(), timeout);
      try {
        const pingRes = await fetch("/api/ping", { signal: ctrl1.signal });
        const pingData = await pingRes.json();
        clearTimeout(t1);
        setPing(pingData);
      } catch (e) {
        clearTimeout(t1);
        setPing({
          ok: false,
          error: e instanceof Error && e.name === "AbortError" ? "Timed out" : String(e),
        });
      }

      const ctrl2 = new AbortController();
      const t2 = setTimeout(() => ctrl2.abort(), timeout);
      try {
        const healthRes = await fetch("/api/tiles/health", { signal: ctrl2.signal });
        const healthData = await healthRes.json();
        clearTimeout(t2);
        setHealth(healthData);
      } catch (e) {
        clearTimeout(t2);
        setHealth({
          ok: false,
          error: e instanceof Error && e.name === "AbortError" ? "Timed out" : String(e),
        });
      }
    };
    run();
  }, []);

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900 font-mono text-sm">
      <h1 className="text-xl font-bold mb-4">Debug</h1>

      <h2 className="font-semibold mt-6 mb-2">1. Ping (no DB)</h2>
      <pre className="bg-white dark:bg-gray-800 p-4 rounded border overflow-auto">
        {ping !== null ? JSON.stringify(ping, null, 2) : "Loading…"}
      </pre>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        If this times out, API routes are not responding at all (Vercel/network issue).
      </p>

      <h2 className="font-semibold mt-6 mb-2">2. DB Health</h2>
      <pre className="bg-white dark:bg-gray-800 p-4 rounded border overflow-auto">
        {health !== null ? JSON.stringify(health, null, 2) : "Loading…"}
      </pre>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        If ping works but this times out, the Neon DB connection is slow or failing.
      </p>

      <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
        <h3 className="font-semibold text-amber-800 dark:text-amber-200">If both time out</h3>
        <ul className="mt-2 list-disc list-inside text-amber-800 dark:text-amber-200 space-y-1">
          <li>Vercel → Project → Settings → Functions → enable <strong>Fluid Compute</strong> if available</li>
          <li>Vercel → Project → Settings → Functions → set <strong>Max Duration</strong> to 10 or 15</li>
          <li>Vercel → Project → Settings → Environment Variables → ensure <code>DATABASE_URL</code> is set</li>
          <li>Neon and Vercel in same region (e.g. US East)</li>
        </ul>
      </div>
    </div>
  );
}

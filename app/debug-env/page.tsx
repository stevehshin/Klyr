"use client";

import { useEffect, useState } from "react";

export default function DebugEnvPage() {
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch("/api/tiles/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch((e) => setHealth({ error: String(e) }));
  }, []);

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900 font-mono text-sm">
      <h1 className="text-xl font-bold mb-4">Debug</h1>

      <h2 className="font-semibold mt-6 mb-2">API / DB Health</h2>
      <pre className="bg-white dark:bg-gray-800 p-4 rounded border overflow-auto">
        {health ? JSON.stringify(health, null, 2) : "Loading…"}
      </pre>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        If <code>ok: true</code>, the database is reachable. If <code>ok: false</code>, check the error above.
      </p>

      <p className="mt-6 text-gray-600 dark:text-gray-400">
        If tiles stay on &quot;Loading…&quot;, visit this page. If health shows <code>ok: false</code>, fix the DB
        connection. If health shows <code>ok: true</code>, the issue may be auth (session cookie).
      </p>
    </div>
  );
}

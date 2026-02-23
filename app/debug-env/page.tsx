export const dynamic = "force-dynamic";

export default function DebugEnvPage() {
  const hasDb = !!process.env.DATABASE_URL;
  const hasDirect = !!process.env.DIRECT_URL;
  const hasJwt = !!process.env.JWT_SECRET;

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900 font-mono text-sm">
      <h1 className="text-xl font-bold mb-4">Environment Check</h1>
      <pre className="bg-white dark:bg-gray-800 p-4 rounded border">
        {JSON.stringify(
          {
            DATABASE_URL: hasDb ? "set" : "NOT SET",
            DIRECT_URL: hasDirect ? "set" : "NOT SET",
            JWT_SECRET: hasJwt ? "set" : "NOT SET",
          },
          null,
          2
        )}
      </pre>
      <p className="mt-4 text-gray-600 dark:text-gray-400">
        If DATABASE_URL is NOT SET, add it in Vercel → Settings → Environment Variables, then
        redeploy with cache disabled.
      </p>
    </div>
  );
}

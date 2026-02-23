/** Minimal test: returns immediately, no DB. Use to verify API routes are reachable. */
export async function GET() {
  return Response.json({ ok: true, t: Date.now() });
}

/**
 * Diagnostic endpoint: verifies tile APIs can reach the database.
 * GET /api/tiles/health - no auth required, returns DB connectivity status.
 */
import { NextResponse } from "next/server";

export const maxDuration = 15;

export async function GET() {
  const checks: Record<string, unknown> = {
    database_url_set: !!process.env.DATABASE_URL,
    jwt_secret_set: !!process.env.JWT_SECRET,
  };

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      ok: false,
      error: "DATABASE_URL not set",
      checks,
    });
  }

  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL);
    const [row] = await sql`SELECT COUNT(*)::int as c FROM "Tile" LIMIT 1`;
    checks.tile_count = (row as { c: number })?.c ?? -1;
    return NextResponse.json({ ok: true, checks });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    return NextResponse.json({
      ok: false,
      error: err.message,
      checks,
    });
  }
}

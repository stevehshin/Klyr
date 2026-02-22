import { NextResponse } from "next/server";

/** GET /api/health - Returns immediately with no DB call. Use this to confirm the app is reachable. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "API is reachable",
    dbCheck: "Use GET /api/health/db to check database connection",
  });
}

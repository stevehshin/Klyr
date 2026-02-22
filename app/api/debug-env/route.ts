import { NextResponse } from "next/server";

/**
 * GET /api/debug-env
 * Safe check: confirms if DATABASE_URL and DIRECT_URL are set (without revealing values).
 * Remove or restrict this route once debugging is done.
 */
export async function GET() {
  const hasDb = !!process.env.DATABASE_URL;
  const hasDirect = !!process.env.DIRECT_URL;
  const hasJwt = !!process.env.JWT_SECRET;
  const dbLen = process.env.DATABASE_URL?.length ?? 0;
  const dbStartsCorrect = process.env.DATABASE_URL?.startsWith("postgresql://") ?? false;

  return NextResponse.json({
    DATABASE_URL: hasDb ? "set" : "NOT SET",
    DIRECT_URL: hasDirect ? "set" : "NOT SET",
    JWT_SECRET: hasJwt ? "set" : "NOT SET",
    DATABASE_URL_length: dbLen,
    DATABASE_URL_starts_with_postgresql: dbStartsCorrect,
  });
}

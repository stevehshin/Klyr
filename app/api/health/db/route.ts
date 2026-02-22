import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const HEALTH_TIMEOUT_MS = 5000;

/** GET /api/health/db - Check database connection. Times out after 5s. */
export async function GET() {
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Database connection timed out after 5s")), HEALTH_TIMEOUT_MS)
      ),
    ]);
    return NextResponse.json({ ok: true, database: "connected" });
  } catch (error) {
    console.error("Health DB check failed:", error);
    const msg = (error as Error)?.message ?? String(error);
    const isTimeout = msg.includes("timed out");
    return NextResponse.json(
      {
        ok: false,
        database: "disconnected",
        error: isTimeout
          ? "Database connection timed out. Check DATABASE_URL and DIRECT_URL in Vercel."
          : msg.includes("DATABASE") || msg.includes("P1001") || msg.includes("Can't reach")
            ? "Set DATABASE_URL and DIRECT_URL in Vercel and run: npx prisma db push"
            : msg,
      },
      { status: 503 }
    );
  }
}

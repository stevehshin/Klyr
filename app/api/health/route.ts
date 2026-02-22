import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const HEALTH_TIMEOUT_MS = 5000;

/** GET /api/health - Check if the app can reach the database. Times out after 5s so the page doesn't spin forever. */
export async function GET() {
  try {
    const result = await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Database connection timed out after 5s")), HEALTH_TIMEOUT_MS)
      ),
    ]);
    return NextResponse.json({ ok: true, database: "connected" });
  } catch (error) {
    console.error("Health check failed:", error);
    const msg = (error as Error)?.message ?? String(error);
    const isTimeout = msg.includes("timed out");
    return NextResponse.json(
      {
        ok: false,
        database: "disconnected",
        error: isTimeout
          ? "Database connection timed out. Check DATABASE_URL and DIRECT_URL in Vercel (use Neon pooled URL for DATABASE_URL) and that the database is running."
          : msg.includes("DATABASE") || msg.includes("P1001") || msg.includes("Can't reach")
            ? "Set DATABASE_URL and DIRECT_URL in Vercel and run: npx prisma db push"
            : msg,
      },
      { status: 503 }
    );
  }
}

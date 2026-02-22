import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/health - Check if the app can reach the database. Useful for debugging Vercel deploy. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, database: "connected" });
  } catch (error) {
    console.error("Health check failed:", error);
    const msg = (error as Error)?.message ?? String(error);
    return NextResponse.json(
      {
        ok: false,
        database: "disconnected",
        error: msg.includes("DATABASE") || msg.includes("P1001") || msg.includes("Can't reach")
          ? "Set DATABASE_URL and DIRECT_URL in Vercel and run: npx prisma db push"
          : msg,
      },
      { status: 503 }
    );
  }
}

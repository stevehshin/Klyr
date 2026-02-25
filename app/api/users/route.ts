import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { neon } from "@neondatabase/serverless";

export const maxDuration = 15;

/**
 * GET /api/users — List users for DM picker (id, email). Excludes current user.
 * Authenticated users only. Uses Neon HTTP for Vercel reliability.
 */
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT id, email, "displayName", "avatarData"
    FROM "User"
    WHERE id != ${session.userId}
    ORDER BY email ASC
  `;
  const users = (rows as Record<string, unknown>[]).map((r) => ({
    id: r.id,
    email: r.email,
    displayName: r.displayName,
    avatarData: r.avatarData,
  }));
  return NextResponse.json({ users });
}

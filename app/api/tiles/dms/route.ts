import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { neon } from "@neondatabase/serverless";

export const maxDuration = 15;

/**
 * GET /api/tiles/dms — List all DM tiles for the current user (across all their grids).
 * Used by the sidebar DMs tab. Uses Neon HTTP for Vercel reliability.
 */
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = neon(process.env.DATABASE_URL!);

  const tiles = await sql`
    SELECT t.id, t."conversationId", t."onGrid", t."gridId", t."createdAt", g.name as grid_name
    FROM "Tile" t
    JOIN "Grid" g ON g.id = t."gridId"
    WHERE t.type = 'dm' AND t.hidden = false AND t."conversationId" IS NOT NULL
      AND (
        g."ownerId" = ${session.userId}
        OR EXISTS (SELECT 1 FROM "GridShare" gs WHERE gs."gridId" = t."gridId" AND gs."userId" = ${session.userId})
      )
    ORDER BY t."createdAt" DESC
  `;

  const list = (tiles as { id: string; conversationId: string | null; onGrid: boolean | null; gridId: string; createdAt: Date; grid_name: string }[]).map((t) => ({
    id: t.id,
    conversationId: t.conversationId,
    conversationName: null as string | null,
    onGrid: t.onGrid ?? true,
    gridId: t.gridId,
    gridName: t.grid_name ?? "",
  }));

  const userIds = list
    .map((l) => l.conversationId)
    .filter((id): id is string => id !== null && !id.startsWith("email-"));
  let userEmailById = new Map<string, string>();
  if (userIds.length > 0) {
    const uniqueIds = [...new Set(userIds)];
    for (const id of uniqueIds) {
      const [row] = await sql`SELECT id, email FROM "User" WHERE id = ${id} LIMIT 1`;
      if (row && (row as { id?: string }).id) {
        const r = row as { id: string; email: string };
        userEmailById.set(r.id, r.email);
      }
    }
  }

  const withNames = list.map((item) => ({
    ...item,
    conversationName:
      item.conversationId?.startsWith("email-")
        ? item.conversationId.replace(/^email-/, "")
        : (item.conversationId && userEmailById.get(item.conversationId)) ?? "DM",
  }));

  return NextResponse.json({ dms: withNames });
}

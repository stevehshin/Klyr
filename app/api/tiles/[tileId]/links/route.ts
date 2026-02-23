import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { neon } from "@neondatabase/serverless";
import {
  getTileGridIdNeon,
  canViewGridNeon,
  canEditGridNeon,
} from "@/lib/neonDb";

export const maxDuration = 15;

/** GET /api/tiles/[tileId]/links - List shared links (anyone with grid view) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tileId: string }> }
) {
  try {
    const session = await getSessionFromRequest(_req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { tileId } = await params;
    const gridId = await getTileGridIdNeon(tileId);
    if (!gridId) return NextResponse.json({ error: "Tile not found" }, { status: 404 });
    if (!(await canViewGridNeon(session.userId, gridId)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      SELECT id, title, url FROM "TileLink"
      WHERE "tileId" = ${tileId}
      ORDER BY "sortOrder" ASC, "createdAt" ASC
    `;
    const links = (rows as { id: string; title: string; url: string }[]).map((r) => ({
      id: r.id,
      title: r.title,
      url: r.url,
    }));
    return NextResponse.json({ links });
  } catch (e) {
    console.error("Tile links GET:", e);
    return NextResponse.json({ error: "Failed to load links" }, { status: 500 });
  }
}

/** POST /api/tiles/[tileId]/links - Add link (requires grid edit) */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tileId: string }> }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { tileId } = await params;
    const gridId = await getTileGridIdNeon(tileId);
    if (!gridId) return NextResponse.json({ error: "Tile not found" }, { status: 404 });
    if (!(await canEditGridNeon(session.userId, gridId)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    let url = typeof body.url === "string" ? body.url.trim() : "";
    if (url && !url.startsWith("http")) url = "https://" + url;
    if (!title || !url) return NextResponse.json({ error: "title and url required" }, { status: 400 });

    const sql = neon(process.env.DATABASE_URL!);
    const [maxRow] = await sql`SELECT COALESCE(MAX("sortOrder"), 0) as m FROM "TileLink" WHERE "tileId" = ${tileId}`;
    const sortOrder = ((maxRow as { m: number })?.m ?? 0) + 1;
    const [link] = await sql`
      INSERT INTO "TileLink" (id, "tileId", title, url, "sortOrder")
      VALUES (gen_random_uuid()::text, ${tileId}, ${title.slice(0, 500)}, ${url.slice(0, 2000)}, ${sortOrder})
      RETURNING id, title, url
    `;
    return NextResponse.json({ link });
  } catch (e) {
    console.error("Tile links POST:", e);
    return NextResponse.json({ error: "Failed to add link" }, { status: 500 });
  }
}

/** DELETE /api/tiles/[tileId]/links?id=xxx - Delete link */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ tileId: string }> }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { tileId } = await params;
    const linkId = req.nextUrl.searchParams.get("id");
    if (!linkId) return NextResponse.json({ error: "id required" }, { status: 400 });
    const gridId = await getTileGridIdNeon(tileId);
    if (!gridId) return NextResponse.json({ error: "Tile not found" }, { status: 404 });
    if (!(await canEditGridNeon(session.userId, gridId)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const sql = neon(process.env.DATABASE_URL!);
    await sql`DELETE FROM "TileLink" WHERE id = ${linkId} AND "tileId" = ${tileId}`;
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Tile links DELETE:", e);
    return NextResponse.json({ error: "Failed to delete link" }, { status: 500 });
  }
}

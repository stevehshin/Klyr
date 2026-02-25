import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { neon } from "@neondatabase/serverless";
import { canViewGridNeon, canEditGridNeon } from "@/lib/neonDb";

export const maxDuration = 15;

/** GET /api/grid/files/[id]?download=1 - Get file for preview or download (inline vs attachment) */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const download = request.nextUrl.searchParams.get("download") === "1";

    const sql = neon(process.env.DATABASE_URL!);
    const [row] = await sql`
      SELECT "gridId", name, "mimeType", size, data FROM "GridFile" WHERE id = ${id} LIMIT 1
    `;
    if (!row) return NextResponse.json({ error: "File not found" }, { status: 404 });

    const file = row as { gridId: string; name: string; mimeType: string; size: number; data: unknown };
    if (!(await canViewGridNeon(session.userId, file.gridId)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    let buffer: Buffer;
    const d = file.data;
    if (Buffer.isBuffer(d)) {
      buffer = d;
    } else if (d instanceof Uint8Array) {
      buffer = Buffer.from(d);
    } else if (typeof d === "string" && d.startsWith("\\x")) {
      buffer = Buffer.from(d.slice(2), "hex");
    } else if (typeof d === "object" && d !== null && "data" in d) {
      buffer = Buffer.from((d as { data: number[] }).data);
    } else {
      buffer = Buffer.from(d as ArrayBuffer);
    }
    const disposition = download ? `attachment; filename="${file.name.replace(/"/g, '\\"')}"` : "inline";
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        "Content-Disposition": disposition,
        "Content-Length": String(file.size),
      },
    });
  } catch (error) {
    console.error("Grid file GET:", error);
    return NextResponse.json({ error: "Failed to get file" }, { status: 500 });
  }
}

/** DELETE /api/grid/files/[id] */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(_request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const sql = neon(process.env.DATABASE_URL!);
    const [row] = await sql`SELECT "gridId" FROM "GridFile" WHERE id = ${id} LIMIT 1`;
    if (!row) return NextResponse.json({ error: "File not found" }, { status: 404 });

    const file = row as { gridId: string };
    if (!(await canEditGridNeon(session.userId, file.gridId)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await sql`DELETE FROM "GridFile" WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Grid file DELETE:", error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}

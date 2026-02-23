import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { neon } from "@neondatabase/serverless";
import { canViewGridNeon } from "@/lib/neonDb";

/** GET /api/grid/files?gridId=xxx - List files for grid (shared with everyone who can view grid) */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const gridId = request.nextUrl.searchParams.get("gridId");
    if (!gridId) return NextResponse.json({ error: "gridId is required" }, { status: 400 });
    if (!(await canViewGridNeon(session.userId, gridId)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      SELECT f.id, f.name, f."mimeType", f.size, f."createdAt", f."uploadedByUserId",
             u.id as "uploadedBy_id", u.email as "uploadedBy_email"
      FROM "GridFile" f
      LEFT JOIN "User" u ON f."uploadedByUserId" = u.id
      WHERE f."gridId" = ${gridId}
      ORDER BY f."createdAt" DESC
    `;

    const files = (rows as Record<string, unknown>[]).map((r) => ({
      id: r.id,
      name: r.name,
      mimeType: r.mimeType,
      size: r.size,
      createdAt: r.createdAt,
      uploadedByUserId: r.uploadedByUserId,
      uploadedBy: r.uploadedBy_id ? { id: r.uploadedBy_id, email: r.uploadedBy_email } : null,
    }));
    return NextResponse.json({ files });
  } catch (error) {
    console.error("Grid files GET:", error);
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 });
  }
}

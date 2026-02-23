import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { neon } from "@neondatabase/serverless";
import { canViewGridNeon, canEditGridNeon } from "@/lib/neonDb";

// GET /api/projects?gridId=xxx - List projects for grid (visibility-scoped)
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
      SELECT id, "gridId", name, description, visibility, "createdByUserId", "createdAt", "updatedAt"
      FROM "Project"
      WHERE "gridId" = ${gridId} AND (visibility = 'SHARED' OR "createdByUserId" = ${session.userId})
      ORDER BY "updatedAt" DESC
    `;
    return NextResponse.json({ projects: rows });
  } catch (error) {
    console.error("Failed to list projects:", error);
    return NextResponse.json({ error: "Failed to list projects" }, { status: 500 });
  }
}

// POST /api/projects - Create project
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const { gridId, name, description, visibility } = body;
    if (!gridId || !name || typeof name !== "string" || !name.trim())
      return NextResponse.json({ error: "gridId and name are required" }, { status: 400 });
    if (!(await canEditGridNeon(session.userId, gridId)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const vis = visibility === "PRIVATE" ? "PRIVATE" : "SHARED";
    const desc = typeof description === "string" ? description.trim() || null : null;
    const sql = neon(process.env.DATABASE_URL!);
    const [project] = await sql`
      INSERT INTO "Project" (id, "gridId", name, description, visibility, "createdByUserId")
      VALUES (gen_random_uuid()::text, ${gridId}, ${name.trim()}, ${desc}, ${vis}, ${session.userId})
      RETURNING id, "gridId", name, description, visibility, "createdByUserId", "createdAt", "updatedAt"
    `;
    return NextResponse.json({ project });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}

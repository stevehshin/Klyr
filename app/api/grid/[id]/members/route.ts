import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { neon } from "@neondatabase/serverless";
import { canViewGridNeon, canManageGridNeon } from "@/lib/neonDb";

export type GridMemberRole = "owner" | "admin" | "edit" | "view";

/** GET /api/grid/[id]/members — list members and their roles (owner + shared). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id: gridId } = await params;
    if (!gridId) return NextResponse.json({ error: "Grid ID required" }, { status: 400 });

    if (!(await canViewGridNeon(session.userId, gridId)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const sql = neon(process.env.DATABASE_URL!);
    const [gridRow] = await sql`
      SELECT "ownerId" FROM "Grid" WHERE id = ${gridId} LIMIT 1
    `;
    if (!gridRow) return NextResponse.json({ error: "Grid not found" }, { status: 404 });

    const ownerId = (gridRow as { ownerId: string }).ownerId;
    const [owner] = await sql`
      SELECT id, email, "displayName" FROM "User" WHERE id = ${ownerId} LIMIT 1
    `;
    const shareRows = await sql`
      SELECT gs."userId", gs.permission, u.email, u."displayName"
      FROM "GridShare" gs
      JOIN "User" u ON u.id = gs."userId"
      WHERE gs."gridId" = ${gridId}
    `;

    const members: { id: string; email: string; displayName: string; role: GridMemberRole }[] = [];
    if (owner) {
      const o = owner as { id: string; email: string; displayName: string | null };
      members.push({
        id: o.id,
        email: o.email,
        displayName: (o.displayName ?? o.email.split("@")[0] ?? o.email).trim(),
        role: "owner",
      });
    }
    for (const r of shareRows as { userId: string; permission: string; email: string; displayName: string | null }[]) {
      const role = (r.permission === "admin" ? "admin" : r.permission === "edit" ? "edit" : "view") as GridMemberRole;
      members.push({
        id: r.userId,
        email: r.email,
        displayName: (r.displayName ?? r.email.split("@")[0] ?? r.email).trim(),
        role,
      });
    }

    return NextResponse.json({ members });
  } catch (e) {
    console.error("Grid members GET:", e);
    return NextResponse.json({ error: "Failed to list members" }, { status: 500 });
  }
}

/** PATCH /api/grid/[id]/members — update a member's role (admin only). Body: { userId, permission: "view" | "edit" | "admin" } */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id: gridId } = await params;
    if (!gridId) return NextResponse.json({ error: "Grid ID required" }, { status: 400 });

    if (!(await canManageGridNeon(session.userId, gridId)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { userId, permission } = body;
    if (!userId || !permission) return NextResponse.json({ error: "userId and permission required" }, { status: 400 });
    if (!["view", "edit", "admin"].includes(permission))
      return NextResponse.json({ error: "permission must be view, edit, or admin" }, { status: 400 });

    const sql = neon(process.env.DATABASE_URL!);
    const [gridRow] = await sql`SELECT "ownerId" FROM "Grid" WHERE id = ${gridId} LIMIT 1`;
    if (!gridRow) return NextResponse.json({ error: "Grid not found" }, { status: 404 });
    if ((gridRow as { ownerId: string }).ownerId === userId)
      return NextResponse.json({ error: "Cannot change owner's role" }, { status: 400 });

    await sql`
      UPDATE "GridShare" SET permission = ${permission}
      WHERE "gridId" = ${gridId} AND "userId" = ${userId}
    `;

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Grid members PATCH:", e);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}

/** DELETE /api/grid/[id]/members — remove a member. Body: { userId } */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id: gridId } = await params;
    if (!gridId) return NextResponse.json({ error: "Grid ID required" }, { status: 400 });

    if (!(await canManageGridNeon(session.userId, gridId)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const userId = body.userId ?? request.nextUrl.searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const sql = neon(process.env.DATABASE_URL!);
    const [gridRow] = await sql`SELECT "ownerId" FROM "Grid" WHERE id = ${gridId} LIMIT 1`;
    if (!gridRow) return NextResponse.json({ error: "Grid not found" }, { status: 404 });
    if ((gridRow as { ownerId: string }).ownerId === userId)
      return NextResponse.json({ error: "Cannot remove grid owner" }, { status: 400 });

    await sql`DELETE FROM "GridShare" WHERE "gridId" = ${gridId} AND "userId" = ${userId}`;

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Grid members DELETE:", e);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}

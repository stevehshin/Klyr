import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { neon } from "@neondatabase/serverless";
import { canViewGridNeon, canEditGridNeon } from "@/lib/neonDb";

export const maxDuration = 15;

/** GET /api/grid/calendar?gridId=xxx&timeMin=ISO&timeMax=ISO */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const gridId = request.nextUrl.searchParams.get("gridId");
    const timeMin = request.nextUrl.searchParams.get("timeMin");
    const timeMax = request.nextUrl.searchParams.get("timeMax");
    if (!gridId) return NextResponse.json({ error: "gridId is required" }, { status: 400 });
    if (!(await canViewGridNeon(session.userId, gridId)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const sql = neon(process.env.DATABASE_URL!);
    let rows;
    if (timeMin && timeMax) {
      const tMin = new Date(timeMin);
      const tMax = new Date(timeMax);
      rows = await sql`
        SELECT e.id, e."gridId", e.title, e.description, e."startAt", e."endAt", e."isAllDay", e.color, e."createdByUserId", e."createdAt",
               u.id as "createdBy_id", u.email as "createdBy_email"
        FROM "GridCalendarEvent" e
        LEFT JOIN "User" u ON e."createdByUserId" = u.id
        WHERE e."gridId" = ${gridId} AND e."startAt" <= ${tMax} AND e."endAt" >= ${tMin}
        ORDER BY e."startAt" ASC
      `;
    } else {
      rows = await sql`
        SELECT e.id, e."gridId", e.title, e.description, e."startAt", e."endAt", e."isAllDay", e.color, e."createdByUserId", e."createdAt",
               u.id as "createdBy_id", u.email as "createdBy_email"
        FROM "GridCalendarEvent" e
        LEFT JOIN "User" u ON e."createdByUserId" = u.id
        WHERE e."gridId" = ${gridId}
        ORDER BY e."startAt" ASC
      `;
    }

    const events = (rows as Record<string, unknown>[]).map((r) => ({
      id: r.id,
      gridId: r.gridId,
      title: r.title,
      description: r.description,
      startAt: r.startAt,
      endAt: r.endAt,
      isAllDay: r.isAllDay,
      color: r.color,
      createdByUserId: r.createdByUserId,
      createdAt: r.createdAt,
      createdBy: r.createdBy_id
        ? { id: r.createdBy_id, email: r.createdBy_email }
        : null,
    }));
    return NextResponse.json({ events });
  } catch (error) {
    console.error("Grid calendar GET:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch events";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST /api/grid/calendar - create event */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const { gridId, title, description, startAt, endAt, isAllDay, color } = body;
    if (!gridId || !title || typeof title !== "string" || !title.trim())
      return NextResponse.json({ error: "gridId and title are required" }, { status: 400 });
    if (!(await canEditGridNeon(session.userId, gridId)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const start = startAt ? new Date(startAt) : new Date();
    const end = endAt ? new Date(endAt) : new Date(start.getTime() + 60 * 60 * 1000);
    if (end < start) return NextResponse.json({ error: "endAt must be after startAt" }, { status: 400 });

    const desc = typeof description === "string" ? description.trim().slice(0, 2000) || null : null;
    const col = typeof color === "string" && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : null;
    const sql = neon(process.env.DATABASE_URL!);
    const [ev] = await sql`
      INSERT INTO "GridCalendarEvent" (id, "gridId", title, description, "startAt", "endAt", "isAllDay", color, "createdByUserId")
      VALUES (gen_random_uuid()::text, ${gridId}, ${title.trim().slice(0, 500)}, ${desc}, ${start.toISOString()}, ${end.toISOString()}, ${!!isAllDay}, ${col}, ${session.userId})
      RETURNING id, "gridId", title, description, "startAt", "endAt", "isAllDay", color, "createdByUserId", "createdAt"
    `;

    const [userRow] = await sql`SELECT id, email FROM "User" WHERE id = ${session.userId} LIMIT 1`;
    const event = {
      ...(ev as object),
      createdBy: userRow ? { id: (userRow as Record<string, unknown>).id, email: (userRow as Record<string, unknown>).email } : null,
    };
    return NextResponse.json({ event });
  } catch (error) {
    console.error("Grid calendar POST:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { neon } from "@neondatabase/serverless";
import { canViewGridNeon, canEditGridNeon } from "@/lib/neonDb";

export const maxDuration = 15;

// GET /api/tasks?gridId=xxx&status=...&assigneeUserId=...&projectId=...&visibility=...
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const gridId = request.nextUrl.searchParams.get("gridId");
    if (!gridId) return NextResponse.json({ error: "gridId is required" }, { status: 400 });
    if (!(await canViewGridNeon(session.userId, gridId)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const status = request.nextUrl.searchParams.get("status");
    const assigneeUserId = request.nextUrl.searchParams.get("assigneeUserId");
    const projectId = request.nextUrl.searchParams.get("projectId");
    const visibility = request.nextUrl.searchParams.get("visibility");

    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      SELECT t.id, t."gridId", t."projectId", t.title, t.description, t.status, t.priority, t."dueAt",
             t."assigneeUserId", t."createdByUserId", t.visibility, t."calendarEventId", t."createdAt", t."updatedAt",
             a.id as "assignee_id", a.email as "assignee_email",
             c.id as "createdBy_id", c.email as "createdBy_email",
             p.id as "project_id", p.name as "project_name"
      FROM "Task" t
      LEFT JOIN "User" a ON t."assigneeUserId" = a.id
      LEFT JOIN "User" c ON t."createdByUserId" = c.id
      LEFT JOIN "Project" p ON t."projectId" = p.id
      WHERE t."gridId" = ${gridId}
        AND (t.visibility = 'SHARED' OR t."createdByUserId" = ${session.userId})
        ${status && status.trim() ? sql`AND t.status = ${status.trim().slice(0, 64)}` : sql``}
        ${assigneeUserId === "__unassigned__" ? sql`AND t."assigneeUserId" IS NULL` : assigneeUserId ? sql`AND t."assigneeUserId" = ${assigneeUserId}` : sql``}
        ${projectId ? sql`AND t."projectId" = ${projectId}` : sql``}
        ${visibility === "PRIVATE" || visibility === "SHARED" ? sql`AND t.visibility = ${visibility}` : sql``}
      ORDER BY t."dueAt" ASC NULLS LAST, t."updatedAt" DESC
    `;

    const tasks = (rows as Record<string, unknown>[]).map((r) => ({
      id: r.id,
      gridId: r.gridId,
      projectId: r.projectId,
      title: r.title,
      description: r.description,
      status: r.status,
      priority: r.priority,
      dueAt: r.dueAt,
      assigneeUserId: r.assigneeUserId,
      createdByUserId: r.createdByUserId,
      visibility: r.visibility,
      calendarEventId: r.calendarEventId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      assignee: r.assignee_id ? { id: r.assignee_id, email: r.assignee_email } : null,
      createdBy: r.createdBy_id ? { id: r.createdBy_id, email: r.createdBy_email } : null,
      project: r.project_id ? { id: r.project_id, name: r.project_name } : null,
    }));
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Failed to list tasks:", error);
    return NextResponse.json({ error: "Failed to list tasks" }, { status: 500 });
  }
}

// POST /api/tasks - Create task
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const { gridId, projectId, title, description, status, priority, dueAt, assigneeUserId, visibility, calendarEventId } = body;
    if (!gridId || !title || typeof title !== "string" || !title.trim())
      return NextResponse.json({ error: "gridId and title are required" }, { status: 400 });
    if (!(await canEditGridNeon(session.userId, gridId)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const vis = visibility === "PRIVATE" ? "PRIVATE" : "SHARED";
    const st = typeof status === "string" && status.trim() ? status.trim().slice(0, 64) : "BACKLOG";
    const pri = ["LOW", "MEDIUM", "HIGH"].includes(priority) ? priority : "MEDIUM";
    const desc = typeof description === "string" ? description.trim() || null : null;
    const due = dueAt ? new Date(dueAt) : null;
    const assignee = assigneeUserId || null;
    const projId = projectId || null;
    const calEvId = calendarEventId || null;

    const sql = neon(process.env.DATABASE_URL!);
    const [taskRow] = await sql`
      INSERT INTO "Task" (id, "gridId", "projectId", title, description, status, priority, "dueAt", "assigneeUserId", "createdByUserId", visibility, "calendarEventId")
      VALUES (gen_random_uuid()::text, ${gridId}, ${projId}, ${title.trim()}, ${desc}, ${st}, ${pri}, ${due?.toISOString() ?? null}, ${assignee}, ${session.userId}, ${vis}, ${calEvId})
      RETURNING id, "gridId", "projectId", title, description, status, priority, "dueAt", "assigneeUserId", "createdByUserId", visibility, "calendarEventId", "createdAt", "updatedAt"
    `;

    const t = taskRow as Record<string, unknown>;
    const assigneeId = t.assigneeUserId as string | null;
    const createdById = t.createdByUserId as string;
    const projIdVal = t.projectId as string | null;

    const [assigneeRow] = assigneeId ? await sql`SELECT id, email FROM "User" WHERE id = ${assigneeId} LIMIT 1` : [null];
    const [createdByRow] = await sql`SELECT id, email FROM "User" WHERE id = ${createdById} LIMIT 1`;
    const [projectRow] = projIdVal ? await sql`SELECT id, name FROM "Project" WHERE id = ${projIdVal} LIMIT 1` : [null];

    const task = {
      ...t,
      assignee: assigneeRow ? { id: (assigneeRow as Record<string, unknown>).id, email: (assigneeRow as Record<string, unknown>).email } : null,
      createdBy: createdByRow ? { id: (createdByRow as Record<string, unknown>).id, email: (createdByRow as Record<string, unknown>).email } : null,
      project: projectRow ? { id: (projectRow as Record<string, unknown>).id, name: (projectRow as Record<string, unknown>).name } : null,
    };
    return NextResponse.json({ task });
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

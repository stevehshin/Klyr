import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { neon } from "@neondatabase/serverless";
import { canEditGridNeon } from "@/lib/neonDb";

export const maxDuration = 15;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getTaskAndPermissionNeon(sql: any, taskId: string, userId: string): Promise<{ task: Record<string, unknown> | null; canEdit: boolean }> {
  const rows = await sql`
    SELECT id, "gridId", "projectId", title, description, status, priority, "dueAt",
           "assigneeUserId", "createdByUserId", visibility, "calendarEventId", "createdAt", "updatedAt"
    FROM "Task"
    WHERE id = ${taskId}
    LIMIT 1
  `;
  const row = Array.isArray(rows) ? rows[0] : (rows as { rows?: unknown[] })?.rows?.[0];
  if (!row) return { task: null, canEdit: false };
  const task = row as Record<string, unknown>;
  const canEdit =
    task.createdByUserId === userId ||
    (task.visibility === "SHARED" && (await canEditGridNeon(userId, task.gridId as string)));
  return { task, canEdit };
}

// PATCH /api/tasks/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error("DATABASE_URL not set");
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }
    const sql = neon(dbUrl);

    const { id } = await params;
    const { task, canEdit } = await getTaskAndPermissionNeon(sql, id, session.userId);
    if (!task || !canEdit) {
      return NextResponse.json({ error: "Task not found or forbidden" }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      description,
      status,
      priority,
      dueAt,
      assigneeUserId,
      projectId,
      visibility,
      calendarEventId,
    } = body;

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIdx = 1;

    if (typeof title === "string" && title.trim()) {
      updates.push(`"title" = $${paramIdx++}`);
      values.push(title.trim());
    }
    if (description !== undefined) {
      updates.push(`"description" = $${paramIdx++}`);
      values.push(typeof description === "string" ? description.trim() || null : null);
    }
    if (typeof status === "string" && status.trim()) {
      updates.push(`"status" = $${paramIdx++}`);
      values.push(status.trim().slice(0, 64));
    }
    if (["LOW", "MEDIUM", "HIGH"].includes(priority)) {
      updates.push(`"priority" = $${paramIdx++}`);
      values.push(priority);
    }
    if (dueAt !== undefined) {
      updates.push(`"dueAt" = $${paramIdx++}`);
      values.push(dueAt ? new Date(dueAt) : null);
    }
    if (assigneeUserId !== undefined) {
      updates.push(`"assigneeUserId" = $${paramIdx++}`);
      values.push(assigneeUserId || null);
    }
    if (projectId !== undefined) {
      updates.push(`"projectId" = $${paramIdx++}`);
      values.push(projectId || null);
    }
    if (visibility === "PRIVATE" || visibility === "SHARED") {
      updates.push(`"visibility" = $${paramIdx++}`);
      values.push(visibility);
    }
    if (calendarEventId !== undefined) {
      updates.push(`"calendarEventId" = $${paramIdx++}`);
      values.push(calendarEventId || null);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    updates.push(`"updatedAt" = $${paramIdx++}`);
    values.push(new Date());
    values.push(id);

    const queryText = `UPDATE "Task" SET ${updates.join(", ")} WHERE id = $${paramIdx} RETURNING id, "gridId", "projectId", title, description, status, priority, "dueAt", "assigneeUserId", "createdByUserId", visibility, "calendarEventId", "createdAt", "updatedAt"`;
    const rows = await sql.query(queryText, values);
    const updatedRow = Array.isArray(rows) ? rows[0] : (rows as { rows?: unknown[] })?.rows?.[0];

    if (!updatedRow) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    const t = updatedRow as Record<string, unknown>;
    const assigneeId = t.assigneeUserId as string | null;
    const createdById = t.createdByUserId as string;
    const projId = t.projectId as string | null;

    const assigneeRows = assigneeId ? await sql`SELECT id, email FROM "User" WHERE id = ${assigneeId} LIMIT 1` : [];
    const createdByRows = await sql`SELECT id, email FROM "User" WHERE id = ${createdById} LIMIT 1`;
    const projectRows = projId ? await sql`SELECT id, name FROM "Project" WHERE id = ${projId} LIMIT 1` : [];

    const assigneeRow = Array.isArray(assigneeRows) ? assigneeRows[0] : (assigneeRows as { rows?: unknown[] })?.rows?.[0];
    const createdByRow = Array.isArray(createdByRows) ? createdByRows[0] : (createdByRows as { rows?: unknown[] })?.rows?.[0];
    const projectRow = Array.isArray(projectRows) ? projectRows[0] : (projectRows as { rows?: unknown[] })?.rows?.[0];

    const taskResponse = {
      ...t,
      assignee: assigneeRow ? { id: (assigneeRow as Record<string, unknown>).id, email: (assigneeRow as Record<string, unknown>).email } : null,
      createdBy: createdByRow ? { id: (createdByRow as Record<string, unknown>).id, email: (createdByRow as Record<string, unknown>).email } : null,
      project: projectRow ? { id: (projectRow as Record<string, unknown>).id, name: (projectRow as Record<string, unknown>).name } : null,
    };

    return NextResponse.json({ task: taskResponse });
  } catch (error) {
    console.error("Failed to update task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error("DATABASE_URL not set");
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }
    const sql = neon(dbUrl);

    const { id } = await params;
    const { task, canEdit } = await getTaskAndPermissionNeon(sql, id, session.userId);
    if (!task || !canEdit) {
      return NextResponse.json({ error: "Task not found or forbidden" }, { status: 404 });
    }

    await sql`DELETE FROM "Task" WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}

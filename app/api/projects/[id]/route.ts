import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewGrid, canEditGrid } from "@/lib/gridAuth";

async function getProjectAndPermission(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });
  if (!project) return { project: null, canView: false, canEdit: false };
  const canView =
    (project.visibility === "SHARED" && (await canViewGrid(userId, project.gridId))) ||
    (project.visibility === "PRIVATE" && project.createdByUserId === userId);
  const canEdit =
    project.createdByUserId === userId ||
    (project.visibility === "SHARED" && (await canEditGrid(userId, project.gridId)));
  return { project, canView, canEdit };
}

// PATCH /api/projects/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const { project, canEdit } = await getProjectAndPermission(id, session.userId);
    if (!project || !canEdit) {
      return NextResponse.json({ error: "Project not found or forbidden" }, { status: 404 });
    }
    const body = await request.json();
    const { name, description, visibility } = body;
    const data: { name?: string; description?: string | null; visibility?: string } = {};
    if (typeof name === "string" && name.trim()) data.name = name.trim();
    if (description !== undefined)
      data.description = typeof description === "string" ? description.trim() || null : null;
    if (visibility === "PRIVATE" || visibility === "SHARED") data.visibility = visibility;
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }
    const updated = await prisma.project.update({
      where: { id },
      data,
    });
    return NextResponse.json({ project: updated });
  } catch (error) {
    console.error("Failed to update project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const { project, canEdit } = await getProjectAndPermission(id, session.userId);
    if (!project || !canEdit) {
      return NextResponse.json({ error: "Project not found or forbidden" }, { status: 404 });
    }
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}

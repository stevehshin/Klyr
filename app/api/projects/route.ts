import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewGrid, canEditGrid } from "@/lib/gridAuth";

// GET /api/projects?gridId=xxx - List projects for grid (visibility-scoped)
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const gridId = request.nextUrl.searchParams.get("gridId");
    if (!gridId) {
      return NextResponse.json({ error: "gridId is required" }, { status: 400 });
    }
    if (!(await canViewGrid(session.userId, gridId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const projects = await prisma.project.findMany({
      where: {
        gridId,
        OR: [
          { visibility: "SHARED" },
          { createdByUserId: session.userId },
        ],
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        gridId: true,
        name: true,
        description: true,
        visibility: true,
        createdByUserId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Failed to list projects:", error);
    return NextResponse.json(
      { error: "Failed to list projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create project
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { gridId, name, description, visibility } = body;
    if (!gridId || !name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "gridId and name are required" },
        { status: 400 }
      );
    }
    if (!(await canEditGrid(session.userId, gridId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const vis = visibility === "PRIVATE" ? "PRIVATE" : "SHARED";
    const project = await prisma.project.create({
      data: {
        gridId,
        name: name.trim(),
        description: typeof description === "string" ? description.trim() || null : null,
        visibility: vis,
        createdByUserId: session.userId,
      },
    });
    return NextResponse.json({ project });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditGrid } from "@/lib/gridAuth";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_PREFIXES = [
  "image/",
  "application/pdf",
  "text/",
  "application/json",
  "application/vnd.openxmlformats", // docx, xlsx, etc.
  "application/msword", // doc
  "video/",
  "audio/",
];

function isAllowedMime(mime: string): boolean {
  if (!mime || mime === "application/octet-stream") return true;
  return ALLOWED_MIME_PREFIXES.some((p) => mime.toLowerCase().startsWith(p));
}

/** POST /api/grid/files/upload - Upload a file (multipart/form-data: file, gridId) */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const formData = await request.formData();
    const gridId = formData.get("gridId") as string | null;
    const file = formData.get("file") as File | null;
    if (!gridId) {
      return NextResponse.json({ error: "gridId is required" }, { status: 400 });
    }
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }
    const mimeType = file.type || "application/octet-stream";
    if (!isAllowedMime(mimeType)) {
      return NextResponse.json(
        { error: "File type not allowed. Allowed: images, PDF, text, documents, video, audio." },
        { status: 400 }
      );
    }

    const canEdit = await canEditGrid(session.userId, gridId);
    if (!canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const name = (file.name || "unnamed").replace(/[^\w\s.-]/gi, "_").slice(0, 255) || "file";

    const gridFile = await prisma.gridFile.create({
      data: {
        gridId,
        name,
        mimeType,
        size: file.size,
        data: buffer,
        uploadedByUserId: session.userId,
      },
      select: {
        id: true,
        name: true,
        mimeType: true,
        size: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ file: gridFile });
  } catch (error) {
    console.error("Grid files upload:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}

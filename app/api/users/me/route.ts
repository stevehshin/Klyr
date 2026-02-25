import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/users/me - Current user profile (displayName, avatarData, bio, funFacts) */
export async function GET(_req: NextRequest) {
  try {
    const session = await getSessionFromRequest(_req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarData: true,
        bio: true,
        funFacts: true,
        encryptionKey: true,
      },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({
      ...user,
      displayName: user.displayName ?? user.email.split("@")[0] ?? user.email,
    });
  } catch (e) {
    console.error("Users me GET:", e);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

/** PATCH /api/users/me - Update profile (displayName, avatarData, bio, funFacts) */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data: { displayName?: string; avatarData?: string | null; bio?: string | null; funFacts?: string | null; encryptionKey?: string | null } = {};
    if (typeof body.displayName === "string") data.displayName = body.displayName.trim().slice(0, 200) || null;
    if (body.avatarData !== undefined) data.avatarData = typeof body.avatarData === "string" ? body.avatarData.slice(0, 500000) : null;
    if (typeof body.bio === "string") data.bio = body.bio.trim().slice(0, 1000) || null;
    if (typeof body.funFacts === "string") data.funFacts = body.funFacts.trim().slice(0, 2000) || null;
    if (body.encryptionKey !== undefined) data.encryptionKey = typeof body.encryptionKey === "string" ? body.encryptionKey.slice(0, 2000) : null;

    const user = await prisma.user.update({
      where: { id: session.userId },
      data,
      select: { id: true, email: true, displayName: true, avatarData: true, bio: true, funFacts: true, encryptionKey: true },
    });
    return NextResponse.json(user);
  } catch (e) {
    console.error("Users me PATCH:", e);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

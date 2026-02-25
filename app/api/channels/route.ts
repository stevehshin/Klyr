import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { neon } from "@neondatabase/serverless";

export const maxDuration = 15;

// GET - Fetch all channels for a user (Neon HTTP for Vercel reliability)
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      SELECT c.id, c.name, c.description, c.emoji, c."isPrivate", c."ownerId", c."createdAt"
      FROM "Channel" c
      WHERE c."ownerId" = ${session.userId}
         OR EXISTS (SELECT 1 FROM "ChannelMember" m WHERE m."channelId" = c.id AND m."userId" = ${session.userId})
      ORDER BY c."createdAt" DESC
    `;
    const channels = (rows as Record<string, unknown>[]).map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      emoji: r.emoji ?? "📢",
      isPrivate: r.isPrivate ?? false,
      ownerId: r.ownerId,
      createdAt: r.createdAt,
    }));
    return NextResponse.json({ channels });
  } catch (error) {
    console.error("Failed to fetch channels:", error);
    return NextResponse.json(
      { error: "Failed to fetch channels" },
      { status: 500 }
    );
  }
}

// POST - Create a new channel
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, emoji, isPrivate } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Channel name is required" },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);
    const [channelRow] = await sql`
      INSERT INTO "Channel" (id, name, description, emoji, "isPrivate", "ownerId")
      VALUES (gen_random_uuid()::text, ${name.trim()}, ${description?.trim() || null}, ${emoji || "📢"}, ${isPrivate || false}, ${session.userId})
      RETURNING id, name, description, emoji, "isPrivate", "ownerId", "createdAt"
    `;
    const ch = channelRow as Record<string, unknown>;
    const channelId = ch.id as string;
    await sql`
      INSERT INTO "ChannelMember" (id, "channelId", "userId", role)
      VALUES (gen_random_uuid()::text, ${channelId}, ${session.userId}, 'owner')
    `;
    const channel = {
      id: ch.id,
      name: ch.name,
      description: ch.description,
      emoji: ch.emoji ?? "📢",
      isPrivate: ch.isPrivate ?? false,
      ownerId: ch.ownerId,
      createdAt: ch.createdAt,
    };
    return NextResponse.json({ channel });
  } catch (error) {
    console.error("Failed to create channel:", error);
    return NextResponse.json(
      { error: "Failed to create channel" },
      { status: 500 }
    );
  }
}

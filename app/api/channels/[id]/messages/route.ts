import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { neon } from "@neondatabase/serverless";

export const maxDuration = 15;

// GET - Fetch messages for a channel
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: channelId } = await params;
    const sql = neon(process.env.DATABASE_URL!);

    const [membership] = await sql`
      SELECT 1 FROM "ChannelMember" WHERE "channelId" = ${channelId} AND "userId" = ${session.userId} LIMIT 1
    `;
    if (!membership) {
      return NextResponse.json({ error: "You are not a member of this channel" }, { status: 403 });
    }

    const rows = await sql`
      SELECT m.id, m."channelId", m."userId", m."encryptedContent", m."createdAt",
             u.id as "user_id", u.email as "user_email", u."displayName" as "user_displayName", u."avatarData" as "user_avatarData"
      FROM "ChannelMessage" m
      JOIN "User" u ON m."userId" = u.id
      WHERE m."channelId" = ${channelId}
      ORDER BY m."createdAt" ASC
    `;

    const messages = (rows as Record<string, unknown>[]).map((r) => ({
      id: r.id,
      channelId: r.channelId,
      userId: r.userId,
      encryptedContent: r.encryptedContent,
      createdAt: r.createdAt,
      user: {
        id: r.user_id,
        email: r.user_email,
        displayName: r.user_displayName,
        avatarData: r.user_avatarData,
      },
    }));

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

// POST - Send a message to a channel
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: channelId } = await params;
    const body = await request.json();
    const encryptedContent = body?.encryptedContent;
    if (!encryptedContent) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);
    const [membership] = await sql`
      SELECT 1 FROM "ChannelMember" WHERE "channelId" = ${channelId} AND "userId" = ${session.userId} LIMIT 1
    `;
    if (!membership) {
      return NextResponse.json({ error: "You are not a member of this channel" }, { status: 403 });
    }

    const [msg] = await sql`
      INSERT INTO "ChannelMessage" (id, "channelId", "userId", "encryptedContent")
      VALUES (gen_random_uuid()::text, ${channelId}, ${session.userId}, ${encryptedContent})
      RETURNING id, "channelId", "userId", "encryptedContent", "createdAt"
    `;

    const [userRow] = await sql`
      SELECT id, email, "displayName", "avatarData" FROM "User" WHERE id = ${session.userId} LIMIT 1
    `;

    const message = {
      ...(msg as object),
      user: userRow
        ? {
            id: (userRow as Record<string, unknown>).id,
            email: (userRow as Record<string, unknown>).email,
            displayName: (userRow as Record<string, unknown>).displayName,
            avatarData: (userRow as Record<string, unknown>).avatarData,
          }
        : null,
    };

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Failed to send message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

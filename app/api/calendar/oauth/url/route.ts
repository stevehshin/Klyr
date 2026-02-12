import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getGoogleCalendarAuthUrl } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = getGoogleCalendarAuthUrl();
    return NextResponse.json({ url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to get OAuth URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

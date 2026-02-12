import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exchangeCodeForTokens } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/grid?calendar=error", request.url));
  }
  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      return NextResponse.redirect(new URL("/grid?calendar=no_refresh", request.url));
    }
    await prisma.user.update({
      where: { id: session.userId },
      data: { googleCalendarRefreshToken: tokens.refresh_token },
    });
    return NextResponse.redirect(new URL("/grid?calendar=connected", request.url));
  } catch (e) {
    console.error("Calendar OAuth callback error:", e);
    return NextResponse.redirect(new URL("/grid?calendar=error", request.url));
  }
}

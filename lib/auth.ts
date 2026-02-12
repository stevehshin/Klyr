import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "klyr-dev-secret-change-in-production"
);

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return token;
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as { userId: string };
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export async function getSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get("session")?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as { userId: string };
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
}

/** For server-side use: get session and user from DB (includes isAdmin). Returns null if not found. */
export async function getSessionWithUser() {
  const session = await getSession();
  if (!session?.userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, isAdmin: true, createdAt: true },
  });
  if (!user) return null;
  return { ...session, user };
}

/** Require admin: use in server components. Redirects to /grid if not admin. */
export async function requireAdmin() {
  const data = await getSessionWithUser();
  if (!data) return null;
  if (!data.user.isAdmin) return null;
  return data;
}

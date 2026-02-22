import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

const LOGIN_TIMEOUT_MS = 10_000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const result = await Promise.race([
      (async () => {
        const user = await prisma.user.findUnique({
          where: { email },
        });
        if (!user) {
          return NextResponse.json(
            { error: "Invalid email or password" },
            { status: 401 }
          );
        }
        const passwordValid = await compare(password, user.passwordHash);
        if (!passwordValid) {
          return NextResponse.json(
            { error: "Invalid email or password" },
            { status: 401 }
          );
        }
        await createSession(user.id);
        return NextResponse.json({
          success: true,
          user: { id: user.id, email: user.email },
        });
      })(),
      new Promise<NextResponse>((resolve) =>
        setTimeout(
          () =>
            resolve(
              NextResponse.json(
                {
                  error:
                    "Database did not respond in time. Set DATABASE_URL and DIRECT_URL in Vercel (Environment Variables), then run: npx prisma db push",
                },
                { status: 503 }
              )
            ),
          LOGIN_TIMEOUT_MS
        )
      ),
    ]);

    return result;
  } catch (error) {
    console.error("Login error:", error);
    const msg = (error as Error)?.message ?? String(error);
    const isDb =
      msg.includes("DATABASE") ||
      msg.includes("P1001") ||
      msg.includes("Can't reach") ||
      msg.includes("connection") ||
      msg.includes("ECONNREFUSED");
    return NextResponse.json(
      {
        error: isDb
          ? "Database is unavailable. Check that DATABASE_URL and DIRECT_URL are set in Vercel and the database is running."
          : "An error occurred during login. Please try again.",
      },
      { status: 503 }
    );
  }
}

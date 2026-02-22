import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const passwordValid = await compare(password, user.passwordHash);

    if (!passwordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create session
    await createSession(user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
    });
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

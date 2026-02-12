import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
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

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hash(password, 12);

    // Create user with a default grid and tiles
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        grids: {
          create: {
            name: "My First Grid",
            tiles: {
              create: [
                {
                  type: "notes",
                  x: 0,
                  y: 0,
                  w: 4,
                  h: 3,
                  hidden: false,
                },
                {
                  type: "dm",
                  x: 4,
                  y: 0,
                  w: 4,
                  h: 3,
                  hidden: false,
                },
              ],
            },
          },
        },
      },
    });

    // Create session
    await createSession(user.id);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}

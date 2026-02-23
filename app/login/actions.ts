"use server";

import { compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export async function loginAction(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { error: "Invalid email or password" };
    }

    const passwordValid = await compare(password, user.passwordHash);
    if (!passwordValid) {
      return { error: "Invalid email or password" };
    }

    await createSession(user.id);
  } catch (error) {
    console.error("Login error:", error);
    const msg = (error as Error)?.message ?? String(error);
    const isDb =
      msg.includes("DATABASE") ||
      msg.includes("P1001") ||
      msg.includes("Can't reach") ||
      msg.includes("connection") ||
      msg.includes("ECONNREFUSED");
    return {
      error: isDb
        ? "Database is unavailable. Check DATABASE_URL and DIRECT_URL in Vercel and run: npx prisma db push"
        : "An error occurred during login. Please try again.",
    };
  }

  redirect("/grid");
}

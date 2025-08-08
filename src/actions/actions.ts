"use server";

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function registerUser(
  prevState: { error?: string; success?: string },
  formData: FormData
) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { error: "All fields are required" };
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existingUser) {
    return { error: "User already exists" };
  }

  // hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new User
  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  return redirect("/login");
  // return { success: "User registered successfully" };
}

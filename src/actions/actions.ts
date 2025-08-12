"use server";

import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";
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

  let user;
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    user = existingUser;

    if (existingUser.isVerified) {
      return { error: "User already exits with this email" };
    }

    // Update exisiting user details
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email },
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });
  } else {
    const hashedPassword = await bcrypt.hash(password, 10);

    // create a new user
    user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });
  }

  //generate verification code(6 digits)
  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  const existingVerificationCode = await prisma.verification.findUnique({
    where: { userId: user.id },
  });
  const now = new Date();

  // If entry exists in Verifivation tale, it means user has requested a code before
  if (existingVerificationCode) {
    const { lastSentAt, attempts, lockedUntil } = existingVerificationCode;
    if (lockedUntil && lockedUntil > now) {
      return { error: "Too many attempts. Please try again after 24 hours." };
    }

    const secondsSinceLastAttempt =
      (now.getTime() - lastSentAt.getTime()) / 1000;
    if (secondsSinceLastAttempt < 60) {
      return {
        error: `Please wait ${60 - Math.floor(secondsSinceLastAttempt)} seconds before requesting a new verification code.`,
      };
    }

    await prisma.verification.update({
      where: { userId: user.id },
      data: {
        otp: verificationCode,
        otpExpiresAt: new Date(now.getTime() + 60 * 1000), // OTP expires in 60 seconds
        attempts: attempts + 1,
        lastSentAt: now,
        lockedUntil:
          attempts + 1 >= 5
            ? new Date(now.getTime() + 24 * 60 * 60 * 1000)
            : null,
      },
    });
  } else {
    // If no entry exists, create a new one
    await prisma.verification.create({
      data: {
        userId: user.id,
        otp: verificationCode,
        otpExpiresAt: new Date(now.getTime() + 60 * 1000), // OTP expires in 60 seconds
        lastSentAt: now,
        attempts: 1,
      },
    });
  }
  const emailResponse = await sendVerificationEmail(
    email,
    name,
    verificationCode
  );
  if (!emailResponse.success) {
    return { error: emailResponse.message };
  }
  // return { success: "Verification email sent successfully" };

  return redirect("/otp");
}

export async function verifyOtp(userId: string, enteredOtp: string) {
  const verification = await prisma.verification.findUnique({
    where: { userId },
  });

  if (!verification) {
    return { error: "No verification record found." };
  }

  const now = new Date();
  if (verification.lockedUntil && verification.lockedUntil > now) {
    return {
      error: "Account locked due to too many attempts. Try again later.",
    };
  }

  if (verification.otpExpiresAt < now) {
    return { error: "OTP has expired. Please request a new one." };
  }

  if (verification.otp != enteredOtp) {
    await prisma.verification.update({
      where: { userId },
      data: {
        attempts: verification.attempts + 1,
        lockedUntil:
          verification.attempts + 1 >= 5
            ? new Date(now.getTime() + 24 * 60 * 60 * 1000)
            : null,
      },
    });
    return { error: "Invalid OTP. Please try again." };
  }

  // Way 1
  // await prisma.$transaction([
  //   prisma.user.update({
  //     where: {id: userId},
  //     data: { isVerified: true}
  //   }),
  //   prisma.verification.delete({
  //     where: {userId}
  //   })
  // ])

  // Way 2
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });

    await tx.verification.delete({
      where: { userId },
    });
  });

  return redirect("/login");
}

"use server";

import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  BLOCKED_HOURS,
  MAX_ATTEMPTS,
  OTP_EXPIRATION_SECONDS,
  USERID_COOKIE,
} from "@/constants";
import { Prisma } from "@prisma/client";

export async function registerUser(
  prevState: { error?: string },
  formData: FormData
) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // if (!name || !email || !password) {
  //   return { error: "All fields are required" };
  // }

  const userSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.email({ pattern: z.regexes.html5Email }), // the regex used by browsers to validate input[type=email] fields
    password: z.string().min(5, "Password must be at least 5 characters long"),
  });

  const { error } = userSchema.safeParse({ name, email, password });
  if (error) {
    return { error: error?.issues[0].message };
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
    const { lastSentAt, lockedUntil } = existingVerificationCode;
    if (lockedUntil && lockedUntil > now) {
      return {
        error: `Too many attempts. Please try again after ${BLOCKED_HOURS} hours.`,
      };
    }

    const secondsSinceLastAttempt =
      (now.getTime() - lastSentAt.getTime()) / 1000;
    if (secondsSinceLastAttempt < OTP_EXPIRATION_SECONDS) {
      return {
        error: `Please wait ${OTP_EXPIRATION_SECONDS - Math.floor(secondsSinceLastAttempt)} seconds before requesting a new verification code.`,
      };
    }

    await prisma.verification.update({
      where: { userId: user.id },
      data: {
        otp: verificationCode,
        otpExpiresAt: new Date(now.getTime() + OTP_EXPIRATION_SECONDS * 1000), // OTP expires in OTP_EXPIRATION_SECONDS seconds
        lastSentAt: now,
      },
    });
  } else {
    // If no entry exists, create a new one
    await prisma.verification.create({
      data: {
        userId: user.id,
        otp: verificationCode,
        otpExpiresAt: new Date(now.getTime() + OTP_EXPIRATION_SECONDS * 1000), // OTP expires in OTP_EXPIRATION_SECONDS seconds
        lastSentAt: now,
        attempts: 0,
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

  // set userId in session
  const cookieStore = await cookies();
  cookieStore.set(USERID_COOKIE, user.id, {
    path: "/",
    httpOnly: true, // Restricts the cookie to HTTP requests, preventing client-side access.
    secure: process.env.NODE_ENV === "production", // Ensures the cookie is sent only over HTTPS connections in production
  });

  return redirect("/otp");
}

export async function verifyOtp(userId: string, enteredOtp: string) {
  // console.log({ userId, enteredOtp });
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
    const attemptsLeft = MAX_ATTEMPTS - (verification.attempts + 1);

    await prisma.verification.update({
      where: { userId },
      data: {
        attempts: verification.attempts + 1,
        lockedUntil:
          attemptsLeft <= 0
            ? new Date(now.getTime() + BLOCKED_HOURS * 60 * 60 * 1000)
            : null,
      },
    });

    return {
      error:
        attemptsLeft > 1
          ? `Incorrect OTP. ${attemptsLeft} attempts left.`
          : attemptsLeft === 1
            ? "Last attempt remaining"
            : "Account locked due to too many attempts. Try after 24 hours.",
    };
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
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });

    await tx.verification.delete({
      where: { userId },
    });
  });

  // clear userId cookie so that user cannot access OTP page again by clicking back button
  const cookieStore = await cookies();
  cookieStore.delete(USERID_COOKIE);

  // return redirect("/login");
  return { success: "OTP verified successfully. You can now login." };
}

export async function resendOtp() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(USERID_COOKIE)?.value;
  if (!userId) {
    return redirect("/signup");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) return { error: "Invalid user. " };

  if (user.isVerified) return { error: "User already verified." };

  const verification = await prisma.verification.findUnique({
    where: { userId },
  });
  if (!verification) return redirect("/signup");

  const now = new Date();
  if (verification.lockedUntil && verification.lockedUntil > now) {
    return {
      error: `Too many requests. Please try again after ${BLOCKED_HOURS} hours.`,
    };
  }
  const secondsSinceLastAttempt =
    (now.getTime() - verification.lastSentAt.getTime()) / 1000;
  if (secondsSinceLastAttempt < OTP_EXPIRATION_SECONDS) {
    return {
      error: `Please wait ${OTP_EXPIRATION_SECONDS - Math.floor(secondsSinceLastAttempt)} seconds before requesting a new verification code.`,
    };
  }

  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  await prisma.verification.update({
    where: { userId },
    data: {
      otp: verificationCode,
      otpExpiresAt: new Date(now.getTime() + OTP_EXPIRATION_SECONDS * 1000),
      lastSentAt: now,
    },
  });

  await sendVerificationEmail(user.email, user.name, verificationCode);
  return { success: "OTP sent successfully on your email" };
}

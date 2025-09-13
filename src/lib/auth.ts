import {
  BLOCKED_LOGIN_HOURS,
  CREDENTIAL_PROVIDER_ID,
  MAX_LOGIN_ATTEMPTS,
} from "@/constants";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "./db";
import bcrypt from "bcryptjs";
import { formatDate } from "./utils";
import { JWT } from "next-auth/jwt";

const getEmptyJWT = (errorMsg: string): JWT => ({
  id: "",
  name: "",
  email: "",
  role: "user", // or a sentinel like "unauthenticated"
  error: errorMsg || "some error",
});

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      id: CREDENTIAL_PROVIDER_ID,
      name: "Seth Traders",
      credentials: {
        // name: {
        //   label: "Name",
        //   type: "text",
        //   placeholder: "Enter your name",
        // },
        email: {
          label: "Email",
          type: "email",
          placeholder: "Enter your email",
        },
        password: {
          label: "password",
          type: "password",
          placeholder: "Enter your password",
        },
      },
      async authorize(credentials) {
        // console.log({ credentials });
        const credentialSchema = z.object({
          email: z.string().min(1, "Email is required"),
          password: z.string().min(1, "Password is required"),
        });

        const { error, data } = credentialSchema.safeParse(credentials);
        if (error) {
          throw new Error(error?.issues[0].message);
        }

        const user = await prisma.user.findUnique({
          where: {
            email: data.email,
          },
        });

        if (!user) {
          throw new Error("User not found");
        }

        if (user.provider !== "credentials" || !user.password) {
          throw new Error(`Please login with ${user.provider} account`);
        }

        if (!user.isVerified) {
          throw new Error("Please verify your account before logging in");
        }

        const now = new Date();
        const loginAttempt = await prisma.loginAttempt.findUnique({
          where: { userId: user.id },
        });
        if (
          loginAttempt?.lockedUntil &&
          loginAttempt?.lockedUntil.getTime() > now.getTime()
        ) {
          const unlockDate = formatDate(loginAttempt.lockedUntil);
          throw new Error(
            `Account locked due to multiple failed login attempts. Try again after ${unlockDate}`
          );
        }
        const isPasswordCorrect = await bcrypt.compare(
          data.password,
          user.password
        );
        if (!isPasswordCorrect) {
          const newAttemptCount = (loginAttempt?.attempts || 0) + 1;
          const lockedUntil =
            newAttemptCount >= MAX_LOGIN_ATTEMPTS
              ? new Date(now.getTime() + BLOCKED_LOGIN_HOURS * 60 * 60 * 1000)
              : null;

          // If user has no previous loginAttempt record, create one else update existing record
          await prisma.loginAttempt.upsert({
            where: { userId: user.id },
            update: {
              attempts: newAttemptCount,
              lockedUntil,
              lastAttemptAt: now,
            },
            create: {
              userId: user.id,
              attempts: 1,
              lockedUntil: null,
              lastAttemptAt: now,
            },
          });

          const remainingAttempts = MAX_LOGIN_ATTEMPTS - newAttemptCount;
          if (remainingAttempts <= 0)
            throw new Error(
              `Incorrect email or password. Your account is locked due to multiple failed login attempts. Try again after ${formatDate(lockedUntil)}`
            );
          else if (remainingAttempts === 1)
            throw new Error(
              `Incorrect email or password. Last attempt remaining before your account gets locked.`
            );
          else
            throw new Error(
              `Incorrect email or password. You have ${remainingAttempts} attempts remaining.`
            );
        }

        // Successful Login: Reset Login attempts
        if (
          loginAttempt &&
          (loginAttempt.attempts > 0 || loginAttempt.lockedUntil)
        ) {
          await prisma.loginAttempt.update({
            where: { userId: user.id },
            data: { attempts: 0, lockedUntil: null },
          });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (account?.provider === "google" && profile) {
        if (!profile.email)
          return getEmptyJWT("Email not present in Google profile");

        const existingUser = await prisma.user.findUnique({
          where: { email: profile.email },
        });

        if (!existingUser) {
          const newUser = await prisma.user.create({
            data: {
              email: profile.email,
              name: profile.name ?? "Google User",
              password: null,
              role: "user",
              isVerified: true,
              provider: "google",
            },
          });
          token.id = newUser.id;
          token.name = newUser.name;
          token.email = newUser.email;
          token.role = newUser.role;
          token.error = "";
        } else {
          token.id = existingUser.id;
          token.name = existingUser.name;
          token.email = existingUser.email;
          token.role = existingUser.role;
          token.error = "";
        }
      }

      // Only set token fields from `user` if they haven't already been set. Else in google provider case, they will be overwritten and role is set to null
      if (user && !token.id) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
        token.error = "";
      }
      return token;
    },
    async session({ session, token }) {
      // if (token) {
      //   session.user.id = token.id;
      //   session.user.name = token.name;
      //   session.user.email = token.email;
      //   session.user.role = token.role;
      //   session.user.isValid = token.error ? false : true;
      // }
      session.user = {
        id: token.id,
        name: token.name,
        email: token.email,
        image: session.user?.image ?? null, // preserve image if present
        role: token.role,
        isValid: token.error ? false : true,
      };

      session.error = token.error;
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

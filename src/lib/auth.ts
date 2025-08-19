import { CREDENTIAL_PROVIDER_ID } from "@/constants";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
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

        if (!user.isVerified) {
          throw new Error("Please verify your account before logging in");
        }

        const isPasswordCorrect = await bcrypt.compare(
          data.password,
          user.password
        );
        if (!isPasswordCorrect) {
          throw new Error("Incorrect email or password");
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name as string;
        token.email = user.email;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.role = token.role;
      }
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

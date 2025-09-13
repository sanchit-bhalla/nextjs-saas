import NextAuth from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    error?: string;
    user: {
      id: string;
      name: string;
      email: string;
      image: string | null;
      role: "user" | "admin";
      isValid?: boolean;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    role: "user" | "admin";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name: string;
    email: string;
    role: "user" | "admin";
    error: string;
  }
}

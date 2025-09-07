import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        // console.log({ pathname, token });
        // Allow webhook endpoint
        if (pathname.startsWith("/api/webhook")) {
          return true;
        }

        // Allow auth-related routes if user is not authenticated
        if (
          pathname.startsWith("/api/auth") ||
          pathname === "/login" ||
          pathname === "/signup" ||
          pathname === "/otp"
        ) {
          return !token;
        }

        // Public routes
        if (
          pathname === "/" ||
          pathname.startsWith("/shop") ||
          pathname.startsWith("/orders")
        ) {
          return true;
        }

        // Admin routes require admin role
        if (pathname.startsWith("/all-orders")) {
          return token?.role === "admin";
        }

        // All other routes require authentication
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
      error: "/login",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};

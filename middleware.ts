import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Run Clerk middleware on all non-static routes AND on API routes
    "/((?!.*\\..*|_next).*)",
    "/(api|trpc)(.*)",
    "/((?!sign-in|sign-up|api|_next|.*\\..*).*)",
  ],
};
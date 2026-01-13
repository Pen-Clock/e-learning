import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    /*
     * Protect everything except:
     * - auth routes
     * - public files
     */
    "/((?!sign-in|sign-up|api|_next|.*\\..*).*)",
  ],
};
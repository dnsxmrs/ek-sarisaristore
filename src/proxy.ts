import { NextResponse } from "next/server";

/**
 * Next.js 16 Proxy (formerly Middleware)
 * 
 * Note: For the October 24 local MVP, authentication is inactive and all routes
 * are accessible on the store's local network without restriction.
 * When auth is activated in the future, session checks and route guards can be added here.
 */
export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, png, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

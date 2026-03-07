import { NextRequest, NextResponse } from "next/server"

const ADMIN_ROUTES = ["/admin"]

// This file acts as Next.js Edge Middleware (this fork uses "proxy.ts" instead of "middleware.ts").
// It runs on the Edge before page rendering, providing server-side route protection.
// The exported function must be named "proxy" in this framework version.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("auth_token")?.value

  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r))

  if (isAdminRoute && !token) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    // Only carry the from param if it starts with /admin to prevent open redirect
    if (pathname.startsWith("/admin")) {
      url.searchParams.set("from", pathname)
    }
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  // Exclude static assets and Next.js internals from proxy
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

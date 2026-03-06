import { NextRequest, NextResponse } from "next/server"

const ADMIN_ROUTES = ["/admin"]
const PUBLIC_ROUTES = ["/login", "/menu", "/pago", "/pago/exitoso", "/pago/cancelado", "/"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("auth_token")?.value

  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r))

  if (isAdminRoute && !token) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("from", pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

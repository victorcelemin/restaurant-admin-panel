import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// POST /api/auth/session — Set the HttpOnly auth cookie after login.
// Called from the client after receiving the JWT from /api/proxy/auth/login.
// Setting it server-side allows us to use HttpOnly + Secure flags, which
// prevent JavaScript (including XSS payloads) from reading the session token.
export async function POST(req: NextRequest) {
  const { token } = await req.json()
  if (!token || typeof token !== "string" || token.length > 2048) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 })
  }

  const cookieStore = await cookies()
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  })

  return NextResponse.json({ ok: true })
}

// DELETE /api/auth/session — Clear the auth cookie on logout.
export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete("auth_token")
  return NextResponse.json({ ok: true })
}

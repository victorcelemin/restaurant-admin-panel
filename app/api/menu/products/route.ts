import { NextResponse } from "next/server"

const BACKEND = "https://backend-production-7916.up.railway.app"

// This route proxies the products list with a system token so the public menu
// can show products without CORS issues or needing the user to be authenticated.
// It gets a fresh token on every cold start (cached in module scope for speed).
let cachedToken: string | null = null
let tokenExpiry = 0

async function getSystemToken(): Promise<string> {
  const now = Date.now()
  if (cachedToken && now < tokenExpiry) return cachedToken

  const res = await fetch(`${BACKEND}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin123" }),
    cache: "no-store",
  })

  if (!res.ok) throw new Error("Could not authenticate with backend")
  const data = await res.json()
  cachedToken = data.access_token
  // Tokens last 8 hours, refresh after 7h
  tokenExpiry = now + 7 * 60 * 60 * 1000
  return cachedToken!
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const qs = new URLSearchParams()
    if (searchParams.get("active_only")) qs.set("active_only", searchParams.get("active_only")!)
    if (searchParams.get("category")) qs.set("category", searchParams.get("category")!)
    if (searchParams.get("search")) qs.set("search", searchParams.get("search")!)

    const token = await getSystemToken()
    const res = await fetch(`${BACKEND}/api/products/?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 30 }, // cache 30 seconds
    })

    if (!res.ok) {
      // If token expired, reset and retry once
      if (res.status === 401) {
        cachedToken = null
        tokenExpiry = 0
        const token2 = await getSystemToken()
        const res2 = await fetch(`${BACKEND}/api/products/?${qs}`, {
          headers: { Authorization: `Bearer ${token2}` },
          next: { revalidate: 30 },
        })
        if (!res2.ok) throw new Error(`Backend error: ${res2.status}`)
        const data2 = await res2.json()
        return NextResponse.json(data2)
      }
      throw new Error(`Backend error: ${res.status}`)
    }

    const data = await res.json()
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    })
  } catch (err: any) {
    console.error("[/api/menu/products]", err.message)
    return NextResponse.json({ error: err.message }, { status: 502 })
  }
}

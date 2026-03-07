import { NextResponse } from "next/server"

// Railway backend URL — set RAILWAY_BACKEND in Vercel env vars to override.
const BACKEND =
  process.env.RAILWAY_BACKEND ?? "https://backend-production-7916.up.railway.app"

// System account used to fetch public products on behalf of unauthenticated visitors.
// Set SYSTEM_USERNAME / SYSTEM_PASSWORD in Vercel env vars to use a dedicated
// read-only service account. Falls back to the default admin account.
const SYSTEM_USERNAME = process.env.SYSTEM_USERNAME ?? "admin"
const SYSTEM_PASSWORD = process.env.SYSTEM_PASSWORD ?? "admin123"

// Token cached in module scope — reused across warm serverless invocations.
let cachedToken: string | null = null
let tokenExpiry = 0

async function getSystemToken(): Promise<string> {
  const now = Date.now()
  if (cachedToken && now < tokenExpiry) return cachedToken

  const res = await fetch(`${BACKEND}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: SYSTEM_USERNAME, password: SYSTEM_PASSWORD }),
    cache: "no-store",
  })

  if (!res.ok) throw new Error("Could not authenticate with backend")
  const data = await res.json()
  cachedToken = data.access_token
  // Tokens last 8 hours — refresh after 7h to avoid expiry mid-request
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
      next: { revalidate: 30 },
    })

    if (!res.ok) {
      // Token may have expired — reset and retry once
      if (res.status === 401) {
        cachedToken = null
        tokenExpiry = 0
        const token2 = await getSystemToken()
        const res2 = await fetch(`${BACKEND}/api/products/?${qs}`, {
          headers: { Authorization: `Bearer ${token2}` },
          next: { revalidate: 30 },
        })
        if (!res2.ok) throw new Error(`Backend error: ${res2.status}`)
        return NextResponse.json(await res2.json())
      }
      throw new Error(`Backend error: ${res.status}`)
    }

    return NextResponse.json(await res.json(), {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    })
  } catch (err: any) {
    console.error("[/api/menu/products]", err.message)
    return NextResponse.json({ error: err.message }, { status: 502 })
  }
}

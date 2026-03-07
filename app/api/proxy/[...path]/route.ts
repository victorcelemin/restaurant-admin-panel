import { type NextRequest, NextResponse } from "next/server"

// Server-side only — never exposed to the browser bundle.
// In production (Vercel): proxies to Railway.
// In local dev: proxies to localhost:8000 (set RAILWAY_BACKEND in .env.local to override).
const RAILWAY = process.env.RAILWAY_BACKEND ?? "https://backend-production-7916.up.railway.app"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
  "Access-Control-Max-Age": "86400",
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

async function proxy(req: NextRequest, segments: string[]) {
  const qs = new URL(req.url).search
  // Build target URL. Append trailing slash to satisfy FastAPI routing
  // (FastAPI redirects /api/products → /api/products/ which strips Authorization on redirect).
  const path = segments.join("/")
  // Only add trailing slash if path doesn't already end with slash and has no query-only suffix
  const trailingSlash = path.endsWith("/") ? "" : "/"
  const url = `${RAILWAY}/api/${path}${trailingSlash}${qs}`

  const headers: Record<string, string> = {}
  req.headers.forEach((v, k) => {
    if (k !== "host" && k !== "x-forwarded-host") headers[k] = v
  })

  const body = ["GET", "HEAD"].includes(req.method) ? undefined : await req.arrayBuffer()

  let upstream: Response
  try {
    // Do NOT follow redirects automatically — Railway's 307 redirects to http:// which
    // causes Node.js fetch to strip the Authorization header (cross-scheme redirect).
    // Instead we handle redirects manually to preserve all headers.
    upstream = await fetch(url, { method: req.method, headers, body, redirect: "manual" })

    // If Railway redirects, follow manually with the same headers (preserves Authorization)
    if (upstream.status === 307 || upstream.status === 308) {
      let location = upstream.headers.get("location") || ""
      // Force https if Railway returns http
      if (location.startsWith("http://")) {
        location = "https://" + location.slice(7)
      }
      upstream = await fetch(location, { method: req.method, headers, body: ["GET", "HEAD"].includes(req.method) ? undefined : body, redirect: "manual" })
    }
  } catch (e: any) {
    return NextResponse.json({ error: `Proxy error: ${e.message}` }, { status: 502, headers: CORS })
  }

  const outHeaders: Record<string, string> = { ...CORS }
  upstream.headers.forEach((v, k) => {
    if (!["transfer-encoding", "connection", "keep-alive", "content-encoding"].includes(k)) {
      outHeaders[k] = v
    }
  })
  // Always force content-type for JSON responses
  if (outHeaders["content-type"]?.includes("json")) {
    outHeaders["content-type"] = "application/json; charset=utf-8"
  }

  const resBody = upstream.status === 204 ? null : await upstream.arrayBuffer()
  return new NextResponse(resBody, { status: upstream.status, headers: outHeaders })
}

export const GET    = (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) => ctx.params.then(p => proxy(req, p.path))
export const POST   = (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) => ctx.params.then(p => proxy(req, p.path))
export const PUT    = (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) => ctx.params.then(p => proxy(req, p.path))
export const PATCH  = (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) => ctx.params.then(p => proxy(req, p.path))
export const DELETE = (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) => ctx.params.then(p => proxy(req, p.path))

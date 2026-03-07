import { type NextRequest, NextResponse } from "next/server"

// Server-side only — never exposed to the browser bundle.
// In production (Vercel): proxies to Railway.
// In local dev: proxies to localhost:8000 (set RAILWAY_BACKEND in .env.local).
const RAILWAY = process.env.RAILWAY_BACKEND ?? "https://backend-production-7916.up.railway.app"

// Derive the expected hostname so redirect-following can be validated (SSRF guard).
const RAILWAY_HOST = new URL(RAILWAY).hostname

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
  "Access-Control-Max-Age": "86400",
}

// Explicit allowlist of headers forwarded to the upstream backend.
// Forwarding ALL browser headers (e.g. x-forwarded-for, cookie, x-real-ip) is dangerous:
// it enables header injection and potential IP-spoofing against the backend.
const ALLOWED_REQUEST_HEADERS = new Set([
  "content-type",
  "authorization",
  "accept",
  "accept-language",
  "cache-control",
])

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

async function proxy(req: NextRequest, segments: string[]) {
  const qs = new URL(req.url).search
  // Build target URL. Append trailing slash to satisfy FastAPI routing
  // (FastAPI redirects /api/products → /api/products/ which strips Authorization on redirect).
  const path = segments.join("/")
  const trailingSlash = path.endsWith("/") ? "" : "/"
  const url = `${RAILWAY}/api/${path}${trailingSlash}${qs}`

  // Build a safe header set — only forward whitelisted headers from the browser.
  const headers: Record<string, string> = {}
  req.headers.forEach((v, k) => {
    if (ALLOWED_REQUEST_HEADERS.has(k.toLowerCase())) {
      headers[k] = v
    }
  })

  const body = ["GET", "HEAD"].includes(req.method) ? undefined : await req.arrayBuffer()

  let upstream: Response
  try {
    // Do NOT follow redirects automatically — Railway's 307 redirects to http:// which
    // causes Node.js fetch to strip the Authorization header (cross-scheme redirect).
    // Instead we handle redirects manually to preserve all headers.
    upstream = await fetch(url, { method: req.method, headers, body, redirect: "manual" })

    // If Railway redirects, follow manually with the same headers (preserves Authorization).
    // SSRF guard: only follow redirects to the known Railway hostname.
    if (upstream.status === 307 || upstream.status === 308) {
      let location = upstream.headers.get("location") || ""
      // Upgrade http → https
      if (location.startsWith("http://")) {
        location = "https://" + location.slice(7)
      }
      // Validate the redirect target is still on Railway (prevent SSRF)
      let redirectHost: string
      try {
        redirectHost = new URL(location).hostname
      } catch {
        return NextResponse.json({ error: "Invalid redirect from upstream" }, { status: 502, headers: CORS })
      }
      if (redirectHost !== RAILWAY_HOST) {
        return NextResponse.json({ error: "Redirect to untrusted host blocked" }, { status: 502, headers: CORS })
      }
      upstream = await fetch(location, {
        method: req.method,
        headers,
        body: ["GET", "HEAD"].includes(req.method) ? undefined : body,
        redirect: "manual",
      })
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

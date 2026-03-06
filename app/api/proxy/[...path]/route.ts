import { type NextRequest, NextResponse } from "next/server"

const RAILWAY = "https://backend-production-7916.up.railway.app"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
  "Access-Control-Max-Age": "86400",
}

// Handle preflight OPTIONS — respond immediately, no need to hit Railway
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

async function proxyRequest(request: NextRequest, segments: string[]) {
  const path = segments.join("/")
  const { search } = new URL(request.url)
  const target = `${RAILWAY}/api/${path}${search}`

  // Forward all headers except host
  const headers: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    if (key !== "host") headers[key] = value
  })

  const body = request.method !== "GET" && request.method !== "HEAD"
    ? await request.arrayBuffer()
    : undefined

  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body,
    // Don't follow redirects automatically
    redirect: "manual",
  })

  const responseHeaders: Record<string, string> = { ...CORS_HEADERS }
  upstream.headers.forEach((value, key) => {
    // Don't forward these — let Next.js handle them
    if (!["transfer-encoding", "connection", "keep-alive"].includes(key)) {
      responseHeaders[key] = value
    }
  })

  const responseBody = upstream.status === 204 ? null : await upstream.arrayBuffer()

  return new NextResponse(responseBody, {
    status: upstream.status,
    headers: responseHeaders,
  })
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  return proxyRequest(request, path)
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  return proxyRequest(request, path)
}
export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  return proxyRequest(request, path)
}
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  return proxyRequest(request, path)
}
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  return proxyRequest(request, path)
}

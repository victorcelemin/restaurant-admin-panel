/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: false },
  images: { unoptimized: true },
  // No rewrites needed — /api/proxy/[...path]/route.ts handles all proxying to Railway
  // with proper CORS headers. The rewrite approach caused OPTIONS preflight issues.
}

export default nextConfig

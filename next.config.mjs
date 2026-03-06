/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.BACKEND_URL || "https://backend-production-7916.up.railway.app"

const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return {
      // afterFiles rewrites run AFTER route handlers — so /api/menu/* is handled by
      // the Next.js route handler first; everything else proxies to Railway.
      afterFiles: [
        {
          source: "/api/:path*",
          destination: `${BACKEND_URL}/api/:path*`,
        },
      ],
    }
  },
}

export default nextConfig

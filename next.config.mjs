/** @type {import('next').NextConfig} */

const RAILWAY_BACKEND = "https://backend-production-7916.up.railway.app"

const nextConfig = {
  typescript: { ignoreBuildErrors: false },
  images: { unoptimized: true },
  async rewrites() {
    return {
      // afterFiles: route handlers (/api/menu/products) take priority,
      // everything else (/api/auth/*, /api/orders/*, etc.) proxies to Railway over HTTPS.
      afterFiles: [
        {
          source: "/api/:path*",
          destination: `${RAILWAY_BACKEND}/api/:path*`,
        },
      ],
    }
  },
}

export default nextConfig

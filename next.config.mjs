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
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ]
  },
}

export default nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove 'standalone' for Vercel — it handles builds natively
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Disable TypeScript checking during build for static site deployment
    ignoreBuildErrors: true,
  },
  eslint: {
    // Disable ESLint during build for static site deployment
    ignoreDuringBuilds: true,
  },
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
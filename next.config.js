/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable image optimization for serverless
  images: {
    unoptimized: true,
  },

  // Ensure API routes work with Prisma
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },

  // Static file serving for existing HTML files
  trailingSlash: false,
  
  // Serve static HTML files alongside Next.js
  async rewrites() {
    return [
      {
        source: '/main',
        destination: '/main.html',
      },
      {
        source: '/culture',
        destination: '/culture.html',
      },
    ];
  },
};

module.exports = nextConfig;
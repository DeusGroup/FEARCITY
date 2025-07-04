/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for frontend files
  output: 'standalone',
  
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

  // Custom webpack config for API routes
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Handle Prisma for serverless functions
      config.externals.push('_http_common');
    }
    return config;
  },

  // Ensure API routes work
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },

  // Static file serving
  trailingSlash: false,
  
  // Custom headers for static files
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
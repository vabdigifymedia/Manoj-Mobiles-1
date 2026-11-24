/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL || 'https://api.emistore.in',
    VITE_API_URL: process.env.VITE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.emistore.in',
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL || 'https://api.emistore.in'
    return [
      // Local (Next.js) routes for Feature Images — resolved
      // BEFORE the /api/* backend proxy below so they are never shadowed.
      {
        source: '/api/products/:id/feature-images',
        destination: '/product-feature-images/:id',
      },
      {
        source: '/api/public/feature-images',
        destination: '/feature-images',
      },
      {
        source: '/api/admin/common-images',
        destination: '/feature-images-admin',
      },
      // Local (Next.js) routes for Homepage Layout Position Manager — resolved
      // BEFORE the /api/* backend proxy below so they are never shadowed or 404'd by Spring Boot.
      {
        source: '/api/admin/homepage-layout',
        destination: '/homepage-layout-admin',
      },
      {
        source: '/api/public/homepage-layout',
        destination: '/homepage-layout-public',
      },
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/orders',
        destination: '/account/orders',
        permanent: true,
      },
      {
        source: '/wishlist',
        destination: '/account/wishlist',
        permanent: true,
      },
      {
        source: '/track',
        destination: '/account/orders',
        permanent: true,
      },
    ]
  },
}

export default nextConfig

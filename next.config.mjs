/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://200.141.14.212.nip.io'
    return [
      // Local (Next.js) routes for Common Feature Images — resolved
      // BEFORE the /api/* backend proxy below so they are never shadowed.
      {
        source: '/api/public/feature-images',
        destination: '/feature-images',
      },
      {
        source: '/api/admin/common-images',
        destination: '/feature-images-admin',
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

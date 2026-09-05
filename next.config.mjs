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

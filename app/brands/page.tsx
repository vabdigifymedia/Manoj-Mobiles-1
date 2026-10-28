import type { Metadata } from 'next'
import { serverFetch } from '@/lib/apiClient'
import { fetchCatalogServer, matchesBrand, selectVisible } from '@/lib/productCatalog'
import type { BrandResponseDTO, PageResponse } from '@/lib/types'
import { BrandsClient, type BrandWithCount } from './brands-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'All Official Brands & Partners | EMIStore',
  description:
    'Browse all authorized smartphone and electronics brands available on EMIStore. Shop genuine devices from Apple, Samsung, OnePlus, Xiaomi, vivo, realme and more with easy EMI options.',
  alternates: {
    canonical: 'https://emistore.in/brands',
  },
  openGraph: {
    title: 'All Official Brands & Partners | EMIStore',
    description:
      'Browse all authorized smartphone and electronics brands available on EMIStore with easy EMI options and manufacturer warranty.',
    url: 'https://emistore.in/brands',
    type: 'website',
    images: [
      {
        url: 'https://emistore.in/ogimage.png',
        width: 1672,
        height: 940,
        alt: 'EMIStore - Official Brands & Partners',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'All Official Brands & Partners | EMIStore',
    description:
      'Browse all authorized smartphone and electronics brands available on EMIStore with easy EMI options and manufacturer warranty.',
    images: ['https://emistore.in/ogimage.png'],
  },
}

const FALLBACK_BRANDS: BrandResponseDTO[] = [
  {
    id: 'apple',
    name: 'Apple',
    slug: 'apple',
    logoUrl: 'https://res.cloudinary.com/wgrpodxl/image/upload/v1786954452/ManojMobiles/brands/dphegxsm1m6zxar358rv.png',
    description: 'Premium smartphones known for elegant design, powerful performance, advanced cameras, and a seamless user experience.',
  },
  {
    id: 'samsung',
    name: 'Samsung',
    slug: 'samsung',
    logoUrl: 'https://res.cloudinary.com/wgrpodxl/image/upload/v1788169893/ManojMobiles/brands/hannfa0gsjpcfdu8ndlf.png',
    description: 'Innovative smartphones combining powerful performance, premium design, and advanced camera technology.',
  },
  {
    id: 'vivo',
    name: 'vivo',
    slug: 'vivo',
    logoUrl: 'https://res.cloudinary.com/wgrpodxl/image/upload/v1788170416/ManojMobiles/brands/dloqdghcxyq77v14injt.png',
    description: 'Stylish smartphones featuring impressive cameras, smooth performance, and innovative technology for everyday use.',
  },
  {
    id: 'oppo',
    name: 'Oppo',
    slug: 'oppo',
    logoUrl: 'https://res.cloudinary.com/wgrpodxl/image/upload/v1788169752/ManojMobiles/brands/dv3ajbq6sr0w8vkl57gg.png',
    description: 'Sleek smartphones with impressive cameras, fast performance, and modern design.',
  },
  {
    id: 'xiaomi',
    name: 'Xiaomi',
    slug: 'xiaomi',
    logoUrl: 'https://res.cloudinary.com/wgrpodxl/image/upload/v1788170074/ManojMobiles/brands/n3syjcgok8qcllfjeswc.png',
    description: 'Feature-packed smartphones offering powerful performance, modern designs, advanced technology, and excellent value.',
  },
  {
    id: 'realme',
    name: 'realme',
    slug: 'realme',
    logoUrl: 'https://res.cloudinary.com/wgrpodxl/image/upload/v1788170329/ManojMobiles/brands/pns6ho1pn4oke8f2fuhr.png',
    description: 'Stylish and feature-packed smartphones offering powerful performance at great value.',
  },
  {
    id: 'motorola',
    name: 'Motorola',
    slug: 'motorola',
    logoUrl: 'https://res.cloudinary.com/wgrpodxl/image/upload/v1788341445/ManojMobiles/brands/grmrehmsxeunxxu6bpa7.png',
    description: 'Reliable smartphones combining clean design, smooth performance, innovative features, and great value.',
  },
  {
    id: 'redmi',
    name: 'Redmi',
    slug: 'redmi',
    logoUrl: 'https://res.cloudinary.com/wgrpodxl/image/upload/v1788341543/ManojMobiles/brands/vdbwurlyesxmus9wmmwj.png',
    description: 'Feature-rich smartphones focused on performance, reliability, and excellent value.',
  },
]

export default async function BrandsPage() {
  const [brandsRes, catalog] = await Promise.all([
    serverFetch<PageResponse<BrandResponseDTO>>('/api/public/brands?page=0&size=100').catch(() => null),
    fetchCatalogServer().catch(() => []),
  ])

  const fetchedBrands = brandsRes?.content && brandsRes.content.length > 0 ? brandsRes.content : FALLBACK_BRANDS
  const visibleProducts = selectVisible(catalog)

  const brandsWithCount: BrandWithCount[] = fetchedBrands.map(brand => {
    const productCount = visibleProducts.filter(p => matchesBrand(p, brand)).length
    return {
      ...brand,
      productCount,
    }
  })

  return <BrandsClient brands={brandsWithCount} />
}


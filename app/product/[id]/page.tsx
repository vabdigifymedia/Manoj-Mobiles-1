import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { serverFetch } from '@/lib/apiClient'
import type { ProductResponseDTO } from '@/lib/types'
import { ProductDetailClient } from '@/components/product-detail'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const product = await serverFetch<ProductResponseDTO>(`/api/public/products/${id}`)

  if (!product) {
    return {
      title: 'Product Not Found',
    }
  }

  const primaryImage = product.variants[0]?.images?.find(img => img.isPrimary)?.url 
    || product.variants[0]?.imageUrls?.[0] 
    || '/placeholder.png'

  return {
    title: `${product.name} | Manoj Mobiles`,
    description: product.description || `Buy ${product.name} at Manoj Mobiles. Fast delivery and genuine products.`,
    openGraph: {
      title: product.name,
      description: product.description || `Buy ${product.name} at Manoj Mobiles.`,
      images: [
        {
          url: primaryImage,
          width: 800,
          height: 600,
          alt: product.name,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description,
      images: [primaryImage],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params
  const product = await serverFetch<ProductResponseDTO>(`/api/public/products/${id}`)

  if (!product) {
    notFound()
  }

  return <ProductDetailClient product={product} />
}

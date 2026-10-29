'use client'

import { useParams } from 'next/navigation'
import { ProductWizard } from '@/components/admin/product-wizard'

export default function AdminProductCatchAllPage() {
  const params = useParams<{ id: string }>()
  const productId = params?.id

  return <ProductWizard productId={productId} />
}


'use client'

import { ProductWizard } from '@/components/admin/product-wizard'
import { use } from 'react'

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  // Pass the productId to the wizard so it knows it is in edit mode
  return <ProductWizard productId={resolvedParams.id} />
}

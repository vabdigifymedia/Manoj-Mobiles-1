import { Metadata } from 'next'
import { CompareClient } from '@/components/compare-client'

export const metadata: Metadata = {
  title: 'Compare Mobiles | Manoj Mobiles',
  description: 'Compare smartphone specifications, prices, features, and offers side-by-side.',
}

export default function ComparePage() {
  return <CompareClient />
}

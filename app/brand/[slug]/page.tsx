import { redirect } from 'next/navigation'

export default async function BrandStorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  redirect(`/shop?brand=${encodeURIComponent(slug)}`)
}

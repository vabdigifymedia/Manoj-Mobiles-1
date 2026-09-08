import { ProductGridSkeleton } from '@/components/shop/product-grid-skeleton'

export default function GlobalBuyLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded-full bg-muted animate-pulse" />
          <div className="h-8 w-56 rounded-full bg-muted animate-pulse" />
          <div className="h-3.5 w-32 rounded-full bg-muted animate-pulse" />
        </div>
        <div className="h-10 w-36 rounded-full bg-muted animate-pulse" />
      </div>

      {/* Brand Filter Pills Skeleton */}
      <div className="flex gap-2 pb-3 mb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-9 w-24 rounded-full bg-muted animate-pulse" />
        ))}
      </div>

      {/* Section Subheading Skeleton */}
      <div className="mb-4 pb-2 border-b border-border flex items-center justify-between">
        <div className="h-6 w-48 rounded bg-muted animate-pulse" />
        <div className="h-3.5 w-20 rounded bg-muted animate-pulse" />
      </div>

      {/* Product Grid Skeleton (existing component) */}
      <ProductGridSkeleton count={8} />
    </main>
  )
}

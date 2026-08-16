import { ProductGridSkeleton } from '@/components/shop/product-grid-skeleton'

export default function ShopLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded-full bg-muted animate-pulse" />
          <div className="h-8 w-56 rounded-full bg-muted animate-pulse" />
          <div className="h-3.5 w-32 rounded-full bg-muted animate-pulse" />
        </div>
        <div className="h-10 w-36 rounded-xl bg-muted animate-pulse" />
      </div>

      <div className="flex gap-8">
        {/* Desktop Filter Sidebar Skeleton */}
        <aside className="hidden md:block w-[260px] shrink-0 space-y-6">
          <div className="h-5 w-20 rounded bg-muted animate-pulse" />
          <div className="h-8 w-full rounded-full bg-muted animate-pulse" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-9 w-full rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-9 w-full rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        </aside>

        {/* Product Grid Skeleton */}
        <div className="flex-1">
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    </main>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col rounded-2xl border border-border bg-card p-3 animate-pulse">
          <div className="aspect-square w-full rounded-xl bg-muted" />
          <div className="mt-4 space-y-2 p-1">
            <div className="h-2.5 w-16 rounded-full bg-muted" />
            <div className="h-3.5 w-full rounded-full bg-muted" />
            <div className="h-3 w-2/3 rounded-full bg-muted" />
            <div className="mt-4 flex items-center justify-between">
              <div className="h-5 w-20 rounded-full bg-muted" />
              <div className="h-8 w-14 rounded-full bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex bg-background text-foreground border-b md:border-b-0 md:border md:rounded-lg w-full py-4 md:p-6 animate-pulse">
           <div className="grid grid-cols-[110px_1fr] md:grid-cols-[1fr_2fr_1.5fr] gap-3 md:gap-6 items-start w-full">
              {/* Image Skeleton */}
              <div className="w-full aspect-[3/4] md:aspect-square max-w-[110px] md:max-w-[200px] mx-auto bg-muted rounded-md md:rounded-lg" />
              
              <div className="flex flex-col gap-1.5 md:contents">
                 {/* Details Skeleton */}
                 <div className="flex flex-col gap-2 pr-8 md:pr-0">
                    <div className="h-4 md:h-6 w-full max-w-[250px] bg-muted rounded" />
                    <div className="h-4 md:h-6 w-2/3 max-w-[200px] bg-muted rounded" />
                    <div className="h-3 md:h-4 w-24 bg-muted rounded mt-2" />
                    <div className="hidden md:flex flex-col gap-2 mt-4">
                       <div className="h-3 w-3/4 bg-muted rounded" />
                       <div className="h-3 w-5/6 bg-muted rounded" />
                       <div className="h-3 w-2/3 bg-muted rounded" />
                    </div>
                 </div>

                 {/* Price Skeleton */}
                 <div className="flex flex-col gap-2 mt-2 md:mt-0">
                    <div className="h-6 md:h-8 w-24 bg-muted rounded" />
                    <div className="h-3 w-32 bg-muted rounded mt-1 md:mt-2" />
                    <div className="h-3 w-24 bg-muted rounded" />
                 </div>
              </div>
           </div>
        </div>
      ))}
    </div>
  )
}

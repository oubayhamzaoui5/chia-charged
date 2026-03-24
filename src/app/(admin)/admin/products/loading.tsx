export default function ProductsLoadingSkeleton() {
  return (
    <div className="space-y-6 p-6 md:p-8">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="h-9 w-48 bg-foreground/10 animate-pulse rounded" />
          <div className="mt-2 h-4 w-64 bg-foreground/10 animate-pulse rounded" />
        </div>
        <div className="h-10 w-36 bg-foreground/10 animate-pulse rounded" />
      </div>

      {/* Search + filters skeleton */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex-1 h-10 bg-foreground/10 animate-pulse rounded-lg" />
        <div className="h-10 w-40 bg-foreground/10 animate-pulse rounded-lg" />
        <div className="h-10 w-40 bg-foreground/10 animate-pulse rounded-lg" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="space-y-3 rounded-lg border border-foreground/10 p-4">
            <div className="aspect-square w-full bg-foreground/10 animate-pulse rounded-lg" />
            <div className="h-5 w-3/4 bg-foreground/10 animate-pulse rounded" />
            <div className="h-4 w-1/2 bg-foreground/10 animate-pulse rounded" />
            <div className="h-6 w-1/3 bg-foreground/10 animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
import { Skeleton } from '@/components/ui/skeleton'
import { Navbar } from '@/components/navbar'

export default function OrdersLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-background to-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-2xl border border-border/70 bg-white/70 p-5 shadow-sm">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>

        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="rounded-2xl border border-border/70 bg-white p-4 shadow-sm sm:p-5">
              <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_auto] lg:items-center">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-16 w-16 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-52" />
                    <Skeleton className="h-3 w-44" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-8 w-56 rounded-full" />
                </div>

                <Skeleton className="h-9 w-28 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

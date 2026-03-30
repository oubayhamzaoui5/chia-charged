import { Skeleton } from '@/components/ui/skeleton'
import { Navbar } from '@/components/navbar'

const FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"

export default function OrdersLoading() {
  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: FONT,
        backgroundColor: '#f5efe4',
        backgroundImage: "url('/texture.webp')",
        backgroundSize: '280px 280px',
      }}
    >
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-32 md:px-8">
        {/* Header skeleton */}
        <div className="mb-10">
          <Skeleton className="h-12 w-72 bg-black/10" />
          <Skeleton className="mt-3 h-4 w-56 bg-black/7" />
        </div>

        {/* Order card skeletons */}
        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="overflow-hidden bg-white"
              style={{
                border: '4px solid #111',
                borderRadius: '2px',
                boxShadow: '8px 8px 0 #111',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b-3 border-black p-5">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 bg-black/10" style={{ border: '2px solid #111' }} />
                  <div>
                    <Skeleton className="h-4 w-32 bg-black/10" />
                    <Skeleton className="mt-2 h-3 w-20 bg-black/7" />
                    <Skeleton className="mt-1 h-5 w-40 bg-black/10" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-6 w-24 bg-black/10" />
                  <Skeleton className="mt-1 h-3 w-16 bg-black/7" />
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3 p-5">
                {Array.from({ length: 2 }).map((_, itemIdx) => (
                  <div key={itemIdx} className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 bg-black/10" style={{ border: '2px solid #111' }} />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-48 bg-black/10" />
                      <Skeleton className="mt-1 h-3 w-28 bg-black/7" />
                    </div>
                    <Skeleton className="h-4 w-20 bg-black/10" />
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t-3 border-black p-5" style={{ background: 'rgba(0,0,0,0.02)' }}>
                <div>
                  <Skeleton className="h-3 w-32 bg-black/7" />
                  <Skeleton className="mt-2 h-6 w-40 bg-black/10" />
                </div>
                <Skeleton className="h-11 w-52 bg-black/10" style={{ border: '3px solid #111' }} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

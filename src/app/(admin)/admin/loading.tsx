import { Skeleton } from '@/components/ui/skeleton'

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Hero skeleton */}
      <div className="brekva-gradient-hero -mx-6 -mt-6 px-8 py-10 rounded-b-2xl opacity-60">
        <Skeleton className="h-9 w-56 bg-white/20" />
        <Skeleton className="mt-2 h-4 w-80 bg-white/10" />
      </div>

      {/* KPI cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="brekva-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-4 w-24 bg-[rgba(255,255,255,0.05)]" />
              <Skeleton className="h-9 w-9 rounded-lg bg-[rgba(255,255,255,0.05)]" />
            </div>
            <Skeleton className="h-9 w-20 bg-[rgba(255,255,255,0.08)]" />
          </div>
        ))}
      </div>

      {/* Rate cards skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="brekva-card rounded-xl p-6">
            <Skeleton className="h-4 w-28 bg-[rgba(255,255,255,0.05)]" />
            <Skeleton className="mt-2 h-9 w-16 bg-[rgba(255,255,255,0.08)]" />
            <Skeleton className="mt-3 h-1.5 w-full rounded-full bg-[rgba(255,255,255,0.04)]" />
          </div>
        ))}
      </div>

      {/* Two columns skeleton */}
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="brekva-card rounded-xl p-6">
            <Skeleton className="h-4 w-40 mb-4 bg-[rgba(255,255,255,0.05)]" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex items-center justify-between rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-lg bg-[rgba(255,255,255,0.05)]" />
                    <div>
                      <Skeleton className="h-4 w-32 bg-[rgba(255,255,255,0.05)]" />
                      <Skeleton className="mt-1 h-3 w-20 bg-[rgba(255,255,255,0.03)]" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-12 bg-[rgba(255,255,255,0.05)]" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

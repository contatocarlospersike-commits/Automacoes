import { Skeleton } from '@/components/ui/skeleton'

export default function ReportsLoading() {
  return (
    <div className="space-y-8">
      {/* Hero skeleton */}
      <div className="brekva-gradient-hero -mx-6 -mt-6 px-8 py-10 rounded-b-2xl opacity-60">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-40 bg-white/20" />
            <Skeleton className="mt-2 h-4 w-72 bg-white/10" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-16 rounded-md bg-white/15" />
            <Skeleton className="h-8 w-16 rounded-md bg-white/10" />
            <Skeleton className="h-8 w-16 rounded-md bg-white/10" />
          </div>
        </div>
      </div>

      {/* KPI cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="brekva-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-28 bg-[rgba(255,255,255,0.05)]" />
              <Skeleton className="h-8 w-8 rounded-lg bg-[rgba(255,255,255,0.05)]" />
            </div>
            <Skeleton className="h-9 w-24 bg-[rgba(255,255,255,0.08)]" />
            <Skeleton className="mt-2 h-3 w-32 bg-[rgba(255,255,255,0.03)]" />
          </div>
        ))}
      </div>

      {/* Status breakdown skeleton */}
      <Skeleton className="h-5 w-40 bg-[rgba(255,255,255,0.05)]" />
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="brekva-card rounded-xl p-4">
            <Skeleton className="h-4 w-16 mb-2 bg-[rgba(255,255,255,0.05)]" />
            <Skeleton className="h-7 w-12 bg-[rgba(255,255,255,0.08)]" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <Skeleton className="h-5 w-48 bg-[rgba(255,255,255,0.05)]" />
      <div className="brekva-card rounded-xl p-4">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full bg-[rgba(255,255,255,0.03)]" />
          ))}
        </div>
      </div>
    </div>
  )
}

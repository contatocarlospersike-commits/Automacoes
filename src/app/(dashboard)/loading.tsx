import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Hero skeleton */}
      <div className="brekva-gradient-hero -mx-6 -mt-6 px-8 py-10 rounded-b-2xl opacity-60">
        <Skeleton className="h-9 w-48 bg-white/20" />
        <Skeleton className="mt-2 h-4 w-72 bg-white/10" />
      </div>

      {/* KPI cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="brekva-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-24 bg-[rgba(255,255,255,0.05)]" />
              <Skeleton className="h-8 w-8 rounded-lg bg-[rgba(255,255,255,0.05)]" />
            </div>
            <Skeleton className="h-8 w-20 bg-[rgba(255,255,255,0.08)]" />
            {i >= 2 && (
              <Skeleton className="mt-3 h-1.5 w-full rounded-full bg-[rgba(255,255,255,0.04)]" />
            )}
            {i < 2 && (
              <Skeleton className="mt-2 h-3 w-32 bg-[rgba(255,255,255,0.03)]" />
            )}
          </div>
        ))}
      </div>

      {/* Breakdown + Health Score skeleton */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3 brekva-card rounded-xl p-6">
          <Skeleton className="h-4 w-40 mb-4 bg-[rgba(255,255,255,0.05)]" />
          <Skeleton className="h-6 w-full rounded-full bg-[rgba(255,255,255,0.04)]" />
          <div className="mt-4 grid grid-cols-3 gap-x-4 gap-y-2 sm:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Skeleton className="h-2.5 w-2.5 rounded-full bg-[rgba(255,255,255,0.06)]" />
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-2 w-10 bg-[rgba(255,255,255,0.03)]" />
                  <Skeleton className="h-3 w-6 bg-[rgba(255,255,255,0.05)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 brekva-card rounded-xl p-6">
          <Skeleton className="h-4 w-32 mb-4 bg-[rgba(255,255,255,0.05)]" />
          <div className="flex items-center gap-6">
            <Skeleton className="h-[140px] w-[140px] shrink-0 rounded-full bg-[rgba(255,255,255,0.04)]" />
            <div className="flex flex-1 flex-col gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <Skeleton className="h-3 w-12 bg-[rgba(255,255,255,0.03)]" />
                    <Skeleton className="h-3 w-8 bg-[rgba(255,255,255,0.05)]" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full bg-[rgba(255,255,255,0.04)]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent campaigns table skeleton */}
      <div className="brekva-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-40 bg-[rgba(255,255,255,0.05)]" />
          <Skeleton className="h-3 w-20 bg-[rgba(255,255,255,0.04)]" />
        </div>
        <div className="space-y-0">
          {/* Header row */}
          <div className="flex items-center gap-4 border-b border-[rgba(255,255,255,0.06)] pb-3">
            {[120, 60, 40, 50, 50, 40, 50].map((w, i) => (
              <Skeleton key={i} className={`h-2 bg-[rgba(255,255,255,0.03)]`} style={{ width: `${w}px` }} />
            ))}
          </div>
          {/* Data rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b border-[rgba(255,255,255,0.03)] py-3"
            >
              <Skeleton className="h-4 w-[120px] bg-[rgba(255,255,255,0.05)]" />
              <Skeleton className="h-5 w-[60px] rounded-full bg-[rgba(255,255,255,0.04)]" />
              <Skeleton className="h-4 w-[40px] bg-[rgba(255,255,255,0.04)]" />
              <Skeleton className="h-4 w-[50px] bg-[rgba(255,255,255,0.04)]" />
              <Skeleton className="h-4 w-[50px] bg-[rgba(255,255,255,0.04)]" />
              <Skeleton className="h-4 w-[40px] bg-[rgba(255,255,255,0.04)]" />
              <Skeleton className="h-3 w-[50px] bg-[rgba(255,255,255,0.03)]" />
            </div>
          ))}
        </div>
      </div>

      {/* Quick overview skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="brekva-card rounded-xl p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl bg-[rgba(255,255,255,0.05)]" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-3 w-28 bg-[rgba(255,255,255,0.03)]" />
                <Skeleton className="h-6 w-12 bg-[rgba(255,255,255,0.06)]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

import { Skeleton } from '@/components/ui/skeleton'

export default function AdminOrganizationsLoading() {
  return (
    <div className="space-y-6">
      {/* Hero skeleton */}
      <div className="brekva-gradient-hero -mx-6 -mt-6 px-8 py-10 rounded-b-2xl opacity-60">
        <Skeleton className="h-9 w-48 bg-white/20" />
        <Skeleton className="mt-2 h-4 w-64 bg-white/10" />
      </div>

      {/* Table skeleton */}
      <div className="brekva-card rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-6 border-b border-[rgba(255,255,255,0.06)] px-6 py-4">
          {[120, 60, 70, 80, 70, 50, 80].map((w, i) => (
            <Skeleton key={i} className="h-3 bg-[rgba(255,255,255,0.03)]" style={{ width: `${w}px` }} />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-6 border-b border-[rgba(255,255,255,0.03)] px-6 py-4"
          >
            <div className="flex items-center gap-3" style={{ width: '120px' }}>
              <Skeleton className="h-9 w-9 rounded-lg bg-[rgba(255,255,255,0.05)]" />
              <div>
                <Skeleton className="h-4 w-20 bg-[rgba(255,255,255,0.05)]" />
                <Skeleton className="mt-1 h-3 w-14 bg-[rgba(255,255,255,0.03)]" />
              </div>
            </div>
            <Skeleton className="h-5 w-[60px] rounded-full bg-[rgba(255,255,255,0.04)]" />
            <Skeleton className="h-4 w-[70px] bg-[rgba(255,255,255,0.04)]" />
            <Skeleton className="h-4 w-[80px] bg-[rgba(255,255,255,0.04)]" />
            <Skeleton className="h-4 w-[70px] bg-[rgba(255,255,255,0.04)]" />
            <Skeleton className="h-4 w-[50px] bg-[rgba(255,255,255,0.04)]" />
            <Skeleton className="h-3 w-[80px] bg-[rgba(255,255,255,0.03)]" />
          </div>
        ))}
      </div>
    </div>
  )
}

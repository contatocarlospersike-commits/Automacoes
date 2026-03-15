import { Skeleton } from '@/components/ui/skeleton'

export default function CampaignsLoading() {
  return (
    <div className="space-y-8">
      {/* Hero skeleton */}
      <div className="brekva-gradient-hero -mx-6 -mt-6 px-8 py-10 rounded-b-2xl opacity-60">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-44 bg-white/20" />
            <Skeleton className="mt-2 h-4 w-80 bg-white/10" />
          </div>
          <Skeleton className="h-10 w-40 rounded-md bg-white/15" />
        </div>
      </div>

      {/* Campaign cards skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="brekva-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-5 w-48 bg-[rgba(255,255,255,0.05)]" />
              <Skeleton className="h-6 w-24 rounded-full bg-[rgba(255,255,255,0.05)]" />
            </div>
            <div className="flex items-center gap-6">
              <Skeleton className="h-4 w-32 bg-[rgba(255,255,255,0.03)]" />
              <Skeleton className="h-4 w-16 bg-[rgba(255,255,255,0.03)]" />
              <Skeleton className="h-4 w-20 bg-[rgba(255,255,255,0.03)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

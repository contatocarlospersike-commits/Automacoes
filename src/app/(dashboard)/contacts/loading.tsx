import { Skeleton } from '@/components/ui/skeleton'

export default function ContactsLoading() {
  return (
    <div className="space-y-8">
      {/* Hero skeleton */}
      <div className="brekva-gradient-hero -mx-6 -mt-6 px-8 py-10 rounded-b-2xl opacity-60">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-36 bg-white/20" />
            <Skeleton className="mt-2 h-4 w-72 bg-white/10" />
          </div>
          <Skeleton className="h-10 w-36 rounded-md bg-white/15" />
        </div>
      </div>

      {/* Search skeleton */}
      <Skeleton className="h-10 w-full max-w-sm bg-[rgba(255,255,255,0.05)]" />

      {/* Table skeleton */}
      <div className="brekva-card rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-[rgba(255,255,255,0.05)]">
          <Skeleton className="h-4 w-12 bg-[rgba(255,255,255,0.05)]" />
          <Skeleton className="h-4 w-40 bg-[rgba(255,255,255,0.05)]" />
          <Skeleton className="h-4 w-32 bg-[rgba(255,255,255,0.05)]" />
          <Skeleton className="h-4 w-24 bg-[rgba(255,255,255,0.05)]" />
        </div>
        {/* Rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-[rgba(255,255,255,0.02)]">
            <Skeleton className="h-4 w-4 rounded bg-[rgba(255,255,255,0.03)]" />
            <Skeleton className="h-4 w-36 bg-[rgba(255,255,255,0.03)]" />
            <Skeleton className="h-4 w-28 bg-[rgba(255,255,255,0.03)]" />
            <Skeleton className="h-4 w-20 bg-[rgba(255,255,255,0.03)]" />
          </div>
        ))}
      </div>
    </div>
  )
}

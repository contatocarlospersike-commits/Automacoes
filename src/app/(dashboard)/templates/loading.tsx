import { Skeleton } from '@/components/ui/skeleton'

export default function TemplatesLoading() {
  return (
    <div className="space-y-8">
      {/* Hero skeleton */}
      <div className="brekva-gradient-hero -mx-6 -mt-6 px-8 py-10 rounded-b-2xl opacity-60">
        <Skeleton className="h-9 w-40 bg-white/20" />
        <Skeleton className="mt-2 h-4 w-72 bg-white/10" />
      </div>

      {/* Button skeleton */}
      <div className="flex justify-end">
        <Skeleton className="h-10 w-40 rounded-md bg-[rgba(255,255,255,0.05)]" />
      </div>

      {/* Template cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="brekva-card rounded-xl p-6">
            <div className="flex items-start justify-between mb-3">
              <Skeleton className="h-5 w-36 bg-[rgba(255,255,255,0.05)]" />
              <Skeleton className="h-6 w-20 rounded-full bg-[rgba(255,255,255,0.05)]" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full mb-3 bg-[rgba(255,255,255,0.03)]" />
            {/* Mini preview skeleton */}
            <div className="rounded-lg bg-[#0B141A] p-3 mb-3">
              <Skeleton className="h-16 w-full rounded bg-[rgba(255,255,255,0.03)]" />
            </div>
            <Skeleton className="h-3 w-20 bg-[rgba(255,255,255,0.03)]" />
          </div>
        ))}
      </div>
    </div>
  )
}

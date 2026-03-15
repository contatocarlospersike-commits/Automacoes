import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsLoading() {
  return (
    <div className="space-y-8">
      {/* Hero skeleton */}
      <div className="brekva-gradient-hero -mx-6 -mt-6 px-8 py-10 rounded-b-2xl opacity-60">
        <Skeleton className="h-9 w-48 bg-white/20" />
        <Skeleton className="mt-2 h-4 w-80 bg-white/10" />
      </div>

      {/* Form skeleton */}
      <div className="brekva-card rounded-xl p-6 max-w-2xl">
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32 bg-[rgba(255,255,255,0.05)]" />
              <Skeleton className="h-10 w-full bg-[rgba(255,255,255,0.03)]" />
            </div>
          ))}
          <Skeleton className="h-10 w-32 bg-[rgba(255,255,255,0.08)]" />
        </div>
      </div>
    </div>
  )
}

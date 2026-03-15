export default function BillingLoading() {
  return (
    <div className="space-y-6">
      {/* Hero skeleton */}
      <div className="brekva-gradient-hero -mx-6 -mt-6 px-8 py-10 rounded-b-2xl">
        <div className="h-8 w-64 animate-pulse rounded bg-white/20" />
        <div className="mt-2 h-4 w-96 animate-pulse rounded bg-white/10" />
      </div>

      {/* Cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl bg-[#1A1B2E] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 animate-pulse rounded bg-[rgba(255,255,255,0.06)]" />
              <div className="h-8 w-8 animate-pulse rounded-lg bg-[rgba(255,255,255,0.06)]" />
            </div>
            <div className="h-8 w-32 animate-pulse rounded bg-[rgba(255,255,255,0.06)]" />
            <div className="h-4 w-48 animate-pulse rounded bg-[rgba(255,255,255,0.06)]" />
            <div className="h-4 w-36 animate-pulse rounded bg-[rgba(255,255,255,0.06)]" />
          </div>
        ))}
      </div>

      {/* Projection bar skeleton */}
      <div className="rounded-xl bg-[#1A1B2E] p-6 space-y-4">
        <div className="h-4 w-48 animate-pulse rounded bg-[rgba(255,255,255,0.06)]" />
        <div className="h-4 w-full animate-pulse rounded-full bg-[rgba(255,255,255,0.06)]" />
        <div className="flex gap-6">
          <div className="h-3 w-32 animate-pulse rounded bg-[rgba(255,255,255,0.06)]" />
          <div className="h-3 w-32 animate-pulse rounded bg-[rgba(255,255,255,0.06)]" />
        </div>
      </div>

      {/* Invoices skeleton */}
      <div className="rounded-xl bg-[#1A1B2E] p-6 space-y-3">
        <div className="h-4 w-32 animate-pulse rounded bg-[rgba(255,255,255,0.06)]" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-full animate-pulse rounded bg-[rgba(255,255,255,0.03)]" />
        ))}
      </div>
    </div>
  )
}

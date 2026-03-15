export default function GroupsLoading() {
  return (
    <div className="space-y-8">
      <div className="brekva-gradient-hero -mx-6 -mt-6 px-8 py-10 rounded-b-2xl">
        <div className="h-10 w-48 bg-white/10 rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-[#1E293B] animate-pulse" />
        ))}
      </div>
    </div>
  )
}

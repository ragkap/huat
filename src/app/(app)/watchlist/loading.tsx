export default function WatchlistLoading() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="px-5 py-4 border-b border-[#282828]">
        <div className="h-6 w-32 rounded bg-[#1C1C1C]" />
      </div>

      {/* Watchlist grid skeleton */}
      <div className="px-5 py-4 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-[#141414]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-[#1C1C1C]" />
              <div className="space-y-1.5">
                <div className="h-3 w-20 rounded bg-[#1C1C1C]" />
                <div className="h-2.5 w-32 rounded bg-[#141414]" />
              </div>
            </div>
            <div className="text-right space-y-1.5">
              <div className="h-3 w-16 rounded bg-[#1C1C1C] ml-auto" />
              <div className="h-2.5 w-12 rounded bg-[#141414] ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

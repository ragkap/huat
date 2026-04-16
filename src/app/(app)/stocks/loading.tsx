export default function StocksLoading() {
  return (
    <div className="animate-pulse">
      {/* Filter bar skeleton */}
      <div className="px-5 py-4 border-b border-[#282828] flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-7 w-16 rounded-full bg-[#1C1C1C]" />
        ))}
      </div>

      {/* Stock rows skeleton */}
      <div className="px-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3.5 border-b border-[#141414]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-[#1C1C1C]" />
              <div className="space-y-1.5">
                <div className="h-3 w-24 rounded bg-[#1C1C1C]" />
                <div className="h-2.5 w-36 rounded bg-[#141414]" />
              </div>
            </div>
            <div className="text-right space-y-1.5">
              <div className="h-3 w-14 rounded bg-[#1C1C1C] ml-auto" />
              <div className="h-2.5 w-10 rounded bg-[#141414] ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

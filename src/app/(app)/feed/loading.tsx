export default function FeedLoading() {
  return (
    <div>
      {/* Tabs skeleton */}
      <div className="flex border-b border-[#282828] sticky top-14 z-10 bg-[#0A0A0A]">
        {["For You", "Followed", "Trending", "Saved"].map(label => (
          <div key={label} className="flex-1 py-3.5 text-sm font-medium text-[#555555] text-center select-none">
            {label}
          </div>
        ))}
      </div>

      {/* Composer skeleton */}
      <div className="px-5 py-4 border-b border-[#1A1A1A] animate-pulse">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1C1C1C] flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-3">
            <div className="h-16 rounded-lg bg-[#141414]" />
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <div className="w-5 h-5 rounded bg-[#1C1C1C]" />
                <div className="w-5 h-5 rounded bg-[#1C1C1C]" />
              </div>
              <div className="w-16 h-7 rounded-lg bg-[#1C1C1C]" />
            </div>
          </div>
        </div>
      </div>

      {/* Post skeletons */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="px-5 pt-5 pb-4 border-b border-[#1A1A1A] animate-pulse">
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-[#1C1C1C] flex-shrink-0" />
            <div className="flex-1 space-y-2.5">
              <div className="flex gap-2 items-center">
                <div className="h-3 w-28 rounded bg-[#1C1C1C]" />
                <div className="h-2.5 w-10 rounded bg-[#141414]" />
              </div>
              <div className="h-3 w-full rounded bg-[#1C1C1C]" />
              <div className="h-3 w-4/5 rounded bg-[#1C1C1C]" />
              <div className="h-3 w-2/3 rounded bg-[#141414]" />
              <div className="flex gap-6 mt-3 pt-1">
                <div className="h-3 w-6 rounded bg-[#141414]" />
                <div className="h-3 w-6 rounded bg-[#141414]" />
                <div className="h-3 w-6 rounded bg-[#141414]" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

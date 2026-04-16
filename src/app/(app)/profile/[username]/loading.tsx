export default function ProfileLoading() {
  return (
    <div>
      {/* Profile header skeleton */}
      <div className="px-5 py-6 border-b border-[#282828] animate-pulse">
        <div className="flex items-start justify-between gap-4">
          <div className="w-16 h-16 rounded-full bg-[#1C1C1C]" />
          <div className="w-24 h-8 rounded bg-[#1C1C1C]" />
        </div>
        <div className="mt-4 space-y-2.5">
          <div className="h-5 w-40 rounded bg-[#1C1C1C]" />
          <div className="h-3 w-24 rounded bg-[#141414]" />
          <div className="h-3 w-full rounded bg-[#141414] mt-3" />
          <div className="flex gap-6 mt-4">
            <div className="h-3 w-20 rounded bg-[#141414]" />
            <div className="h-3 w-20 rounded bg-[#141414]" />
            <div className="h-3 w-16 rounded bg-[#141414]" />
          </div>
        </div>
      </div>

      {/* Post skeletons */}
      {Array.from({ length: 4 }).map((_, i) => (
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

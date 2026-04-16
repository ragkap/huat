export default function SavedLoading() {
  return (
    <div>
      {/* Header */}
      <div className="sticky top-14 z-10 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#282828] hidden sm:flex sm:items-center px-5 py-4">
        <h1 className="text-xl font-black text-[#F0F0F0]">Saved</h1>
      </div>

      {/* Post skeletons */}
      {Array.from({ length: 5 }).map((_, i) => (
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

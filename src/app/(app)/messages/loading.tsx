export default function MessagesLoading() {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-4 border-b border-[#141414]">
          <div className="w-10 h-10 rounded-full bg-[#1C1C1C] flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-3 w-28 rounded bg-[#1C1C1C]" />
              <div className="h-2.5 w-10 rounded bg-[#141414]" />
            </div>
            <div className="h-2.5 w-3/4 rounded bg-[#141414]" />
          </div>
        </div>
      ))}
    </div>
  );
}

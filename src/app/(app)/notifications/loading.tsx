export default function NotificationsLoading() {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-5 py-4 border-b border-[#141414]">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-[#1C1C1C] flex-shrink-0" />
          {/* Text */}
          <div className="flex-1 min-w-0 pt-0.5 space-y-2">
            <div className="h-3 w-3/4 rounded bg-[#1C1C1C]" />
            <div className="h-2.5 w-16 rounded bg-[#141414]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StockPageSkeleton() {
  return (
    <>
      <style>{`
        @keyframes sk-shimmer {
          0% { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
        .sk {
          background: linear-gradient(90deg, #1a1a1a 25%, #242424 50%, #1a1a1a 75%);
          background-size: 600px 100%;
          animation: sk-shimmer 1.4s infinite linear;
          border-radius: 4px;
        }
      `}</style>

      {/* Chart */}
      <div className="border-b border-[#282828] px-5 py-4 bg-[#080808]">
        <div className="flex gap-1 mb-3">
          {["1D","1W","1M","3M","1Y"].map(p => (
            <div key={p} className="sk h-6 w-9" />
          ))}
        </div>
        <div className="sk w-full" style={{ height: 180, borderRadius: 8 }} />
      </div>

      {/* Stats grid */}
      <div className="px-5 py-4 border-b border-[#282828] bg-[#080808]">
        <div className="grid grid-cols-4 gap-x-4 gap-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="sk h-2.5 w-12" />
              <div className="sk h-4 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Primer cards */}
      <div className="px-5 py-4 border-b border-[#282828] space-y-3">
        <div className="border border-[#222222] rounded-lg p-4 space-y-2">
          <div className="sk h-3 w-36 mb-3" />
          <div className="sk h-3 w-full" />
          <div className="sk h-3 w-5/6" />
          <div className="sk h-3 w-4/6" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map(i => (
            <div key={i} className="border border-[#222222] rounded-lg p-4 space-y-2">
              <div className="sk h-3 w-16 mb-3" />
              <div className="sk h-3 w-full" />
              <div className="sk h-3 w-4/5" />
              <div className="sk h-3 w-3/5" />
            </div>
          ))}
        </div>
      </div>

      {/* Community tabs */}
      <div className="px-5 py-3 border-b border-[#282828]">
        <div className="sk h-3 w-24 mb-3" />
        <div className="flex gap-6">
          {[80, 64, 96, 48].map((w, i) => (
            <div key={i} className="sk h-4" style={{ width: w }} />
          ))}
        </div>
      </div>

      {/* Post skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="px-5 py-4 border-b border-[#282828] space-y-2">
          <div className="flex items-center gap-2">
            <div className="sk w-8 h-8 rounded-full flex-shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="sk h-3 w-28" />
              <div className="sk h-2.5 w-20" />
            </div>
          </div>
          <div className="sk h-3 w-full" />
          <div className="sk h-3 w-4/5" />
        </div>
      ))}
    </>
  );
}

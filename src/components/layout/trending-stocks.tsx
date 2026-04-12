export async function TrendingStocks() {
  let stocks: { name: string; bloomberg_ticker: string | null; sector: string | null; slug: string | null }[] = [];
  try {
    const { getSingaporeStocks } = await import("@/lib/stocks-db/client");
    const all = await getSingaporeStocks(200);
    stocks = all.sort(() => Math.random() - 0.5).slice(0, 10);
  } catch {
    stocks = [];
  }

  return (
    <div className="border border-[#282828] rounded p-4">
      <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">SGX Stocks</p>
      {stocks.length === 0 ? (
        <p className="text-xs text-[#9CA3AF]">Loading stocks...</p>
      ) : (
        <div className="space-y-1">
          {stocks.map(s => (
            <a
              key={s.bloomberg_ticker}
              href={`/stocks/${encodeURIComponent(s.slug ?? s.bloomberg_ticker ?? s.name)}`}
              className="flex items-center justify-between hover:bg-[#282828] -mx-2 px-2 py-1.5 rounded transition-colors group"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#E0E0E0] truncate group-hover:text-white">{s.name}</p>
                <p className="text-xs text-[#9CA3AF] font-mono">{s.bloomberg_ticker}</p>
              </div>
              {s.sector && (
                <span className="text-xs text-[#9CA3AF] ml-2 flex-shrink-0">{s.sector.slice(0, 3)}</span>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

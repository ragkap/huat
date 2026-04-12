import { getSingaporeStocks } from "@/lib/stocks-db/client";
import Link from "next/link";

export const metadata = { title: "Singapore Stocks — huat.co" };

export default async function StocksPage() {
  let stocks: Awaited<ReturnType<typeof getSingaporeStocks>> = [];
  try {
    stocks = await getSingaporeStocks(300);
  } catch (e) {
    console.error("Stocks load error:", e);
    stocks = [];
  }

  return (
    <div>
      {/* Header */}
      <div className="sticky top-14 z-10 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#282828] hidden sm:flex sm:items-center px-5 py-4">
        <h1 className="text-xl font-black text-[#F0F0F0]">Singapore Stocks</h1>
        <p className="text-[#9CA3AF] text-sm mt-0.5">
          {stocks.length > 0 ? `${stocks.length} SGX-listed companies` : "SGX-listed companies"}
        </p>
      </div>

      <div className="px-5 py-4">
        {stocks.length === 0 ? (
          <div className="text-center py-20">
            <div className="flex items-end gap-0.5 mb-5 justify-center">
              {[0.5, 1, 0.7].map((h, i) => (
                <span key={i} className="w-1 rounded-full bg-[#E8311A] opacity-40" style={{ height: `${h * 24}px` }} />
              ))}
            </div>
            <p className="text-[#F0F0F0] font-bold mb-2">Could not load stocks</p>
            <p className="text-[#71717A] text-sm">DB connection unavailable</p>
          </div>
        ) : (
          <div>
            {stocks.map(stock => (
              <Link
                key={stock.id}
                href={`/stocks/${encodeURIComponent(stock.slug ?? stock.bloomberg_ticker ?? String(stock.id))}`}
                className="flex items-center justify-between py-3 border-b border-[#141414] hover:bg-[#0D0D0D] -mx-5 px-5 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded bg-[#282828] border border-[#333333] flex items-center justify-center text-xs font-bold text-[#9CA3AF] font-mono flex-shrink-0">
                    {(stock.bloomberg_ticker ?? "??").split(" ")[0].slice(0, 4)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-[#F0F0F0] group-hover:text-white truncate">{stock.name}</p>
                    <p className="text-xs text-[#71717A] font-mono truncate">{stock.bloomberg_ticker}</p>
                  </div>
                </div>
                {stock.sector && (
                  <span className="text-xs text-[#71717A] bg-[#282828] px-2 py-0.5 rounded hidden sm:block ml-3 flex-shrink-0">
                    {stock.sector}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

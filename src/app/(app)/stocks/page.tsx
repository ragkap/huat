import { getSingaporeStocks } from "@/lib/stocks-db/client";
import { StocksFilterClient } from "@/components/stocks/stocks-filter-client";

export const metadata = { title: "Singapore Stocks — huat.co" };

export default async function StocksPage() {
  let stocks = await getSingaporeStocks().catch(() => []);

  return (
    <div>
      {/* Header */}
      <div className="sticky top-14 z-10 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#282828] hidden sm:flex sm:items-center px-5 py-4">
        <h1 className="text-xl font-black text-[#F0F0F0]">Singapore Stocks</h1>
        <p className="text-[#9CA3AF] text-sm mt-0.5">
          {stocks.length > 0 ? `${stocks.length} SGX-listed companies` : "SGX-listed companies"}
        </p>
      </div>

      <StocksFilterClient stocks={stocks} />
    </div>
  );
}

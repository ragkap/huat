import { getSingaporeStocks } from "@/lib/stocks-db/client";
import { StocksFilterClient } from "@/components/stocks/stocks-filter-client";

export const metadata = { title: "Singapore Stocks — huat.co" };

export default async function StocksPage() {
  let stocks = await getSingaporeStocks().catch(() => []);

  return (
    <div>
      <StocksFilterClient stocks={stocks} />
    </div>
  );
}

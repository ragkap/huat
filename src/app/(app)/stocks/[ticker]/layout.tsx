import { getPrimer } from "@/lib/smartkarma/primer";
import { getStockBySlugOrTicker } from "@/lib/stocks-db/client";
import { RHSWidgetsClient } from "@/components/stock/rhs-widgets-client";

interface Props {
  children: React.ReactNode;
  params: Promise<{ ticker: string }>;
}

async function RHSWidgets({ identifier }: { identifier: string }) {
  const stock = await getStockBySlugOrTicker(identifier);
  if (!stock) return null;

  const primerResult = stock.bloomberg_ticker
    ? await getPrimer(stock.bloomberg_ticker)
    : { status: "error" as const, primer: null };

  return (
    <RHSWidgetsClient
      ticker={identifier}
      initialStatus={primerResult.status}
      initialPrimer={primerResult.primer}
      smartScore={null}
    />
  );
}

export default async function StockTickerLayout({ children, params }: Props) {
  const identifier = decodeURIComponent((await params).ticker);

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 min-w-0 min-h-screen">
        {children}
      </div>
      {/* Desktop RHS sidebar */}
      <aside className="w-80 flex-shrink-0 hidden xl:block border-l border-[#282828] px-5 py-3">
        <div className="space-y-4">
          <RHSWidgets identifier={identifier} />
        </div>
      </aside>
    </div>
  );
}

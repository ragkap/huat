import { Suspense } from "react";
import { getSmartScore } from "@/lib/smartkarma/client";
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

  const [smartScore, primerResult] = await Promise.all([
    stock.slug ? getSmartScore(stock.slug).catch(() => null) : null,
    stock.bloomberg_ticker ? getPrimer(stock.bloomberg_ticker) : { status: "error" as const, primer: null },
  ]);

  return (
    <RHSWidgetsClient
      ticker={identifier}
      initialStatus={primerResult.status}
      initialPrimer={primerResult.primer}
      smartScore={smartScore ?? null}
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
      <aside className="w-80 flex-shrink-0 px-5 pb-5 hidden xl:block border-l border-[#282828]">
        <div className="sticky top-16 pt-3 space-y-4 overflow-y-auto max-h-[calc(100vh-4rem)]">
          <Suspense fallback={null}>
            <RHSWidgets identifier={identifier} />
          </Suspense>
        </div>
      </aside>
    </div>
  );
}

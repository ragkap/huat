import { Suspense } from "react";
import { getSmartScore } from "@/lib/smartkarma/client";
import { getStockBySlugOrTicker } from "@/lib/stocks-db/client";
import { SmartScoreWidget } from "@/components/stock/smart-score-widget";

interface Props {
  children: React.ReactNode;
  params: Promise<{ ticker: string }>;
}

async function SmartScoreLoader({ identifier }: { identifier: string }) {
  try {
    const stock = await getStockBySlugOrTicker(identifier);
    if (!stock?.slug) return null;
    const smartScore = await getSmartScore(stock.slug);
    if (smartScore?.score == null) return null;
    return <SmartScoreWidget smartScore={smartScore} />;
  } catch {
    return null;
  }
}

export default function StockTickerLayout({ children, params }: Props) {
  const identifierPromise = params.then(p => decodeURIComponent(p.ticker));

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 min-w-0 min-h-screen">{children}</div>
      <aside className="w-72 xl:w-80 flex-shrink-0 p-5 hidden xl:block border-l border-[#282828]">
        <div className="sticky top-20 space-y-4">
          <Suspense fallback={null}>
            <SmartScoreLoaderWrapper identifierPromise={identifierPromise} />
          </Suspense>
        </div>
      </aside>
    </div>
  );
}

async function SmartScoreLoaderWrapper({ identifierPromise }: { identifierPromise: Promise<string> }) {
  const identifier = await identifierPromise;
  return <SmartScoreLoader identifier={identifier} />;
}

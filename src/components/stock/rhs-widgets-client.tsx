"use client";

import { useState, useEffect, useCallback } from "react";
import type { StockPrimer } from "@/lib/smartkarma/primer";
import type { SmartScore } from "@/lib/smartkarma/client";
import { SmartScoreWidget } from "@/components/stock/smart-score-widget";
import {
  RatingsWidget,
  PortersWidget,
  GrowthWidget,
  DividendWidget,
  CollapsibleWidget,
  PrimerGeneratingWidget,
} from "@/components/stock/primer-widgets";

interface Props {
  ticker: string; // URL slug/ticker for the API call
  initialStatus: "success" | "enqueued" | "error";
  initialPrimer: StockPrimer | null;
  smartScore: SmartScore | null;
}

function mergeScore(primer: StockPrimer | null, smartScore: SmartScore | null) {
  const ps = primer?.smart_scores_values;
  if (!ps) return smartScore;
  return {
    score: ps.overall_smart_score ?? smartScore?.score ?? null,
    trend: smartScore?.trend ?? null,
    value: ps.value ?? smartScore?.value ?? null,
    dividend: ps.dividend ?? smartScore?.dividend ?? null,
    growth: ps.growth ?? smartScore?.growth ?? null,
    resilience: ps.resilience ?? smartScore?.resilience ?? null,
    momentum: ps.momentum ?? smartScore?.momentum ?? null,
  };
}

const POLL_INTERVAL = 15_000; // 15s

export function RHSWidgetsClient({ ticker, initialStatus, initialPrimer, smartScore }: Props) {
  const [polledPrimer, setPolledPrimer] = useState<StockPrimer | null>(null);
  const [polledStatus, setPolledStatus] = useState<"success" | "enqueued" | "error" | null>(null);

  const status = polledStatus ?? initialStatus;
  const primer = polledPrimer ?? initialPrimer;

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/stocks/${encodeURIComponent(ticker)}/primer?fresh=1`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.status === "success" && data.primer) {
        setPolledPrimer(data.primer);
        setPolledStatus("success");
      }
    } catch {
      // silent — keep showing the generating widget
    }
  }, [ticker]);

  useEffect(() => {
    if (status !== "enqueued") return;
    const id = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [status, poll]);

  if (status === "enqueued") {
    return <PrimerGeneratingWidget />;
  }

  const mergedScore = mergeScore(primer, smartScore);

  return (
    <>
      {primer?.ratings && <RatingsWidget ratings={primer.ratings} outlook={primer.outlook} />}
      {mergedScore?.score != null && (
        <SmartScoreWidget
          smartScore={mergedScore}
          analysis={primer?.smartkarma_smartscore_analysis}
        />
      )}
      {primer?.porters_five_forces_score && (
        <PortersWidget porters={primer.porters_five_forces_score} swot={primer.swot_analysis} />
      )}
      {primer?.financial_performance?.length ? (
        <CollapsibleWidget title="Financial Performance" paragraphs={primer.financial_performance} />
      ) : null}
      {primer?.valuation_analysis?.length ? (
        <CollapsibleWidget title="Valuation Analysis" paragraphs={primer.valuation_analysis} />
      ) : null}
      {primer?.growth_track_record?.length ? (
        <GrowthWidget growth={primer.growth_track_record} />
      ) : null}
      {primer?.dividend_summary?.length ? (
        <DividendWidget dividend={primer.dividend_summary} />
      ) : null}
    </>
  );
}

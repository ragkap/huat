/**
 * SmartKarma Primer API client
 * Endpoint: https://data.smartkarma.com/primer?api_token=TOKEN&ticker=BLOOMBERG_TICKER
 * Auth: query param (different from main SK API which uses header auth)
 */

const PRIMER_BASE = process.env.SK_PRIMER_BASE ?? "https://data.smartkarma.com";
const PRIMER_TOKEN = process.env.SK_PRIMER_TOKEN!;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PrimerRatings {
  moat: string | null;
  outlook: string | null;
  overall_rating: string | null;
  uncertainty_rating: string | null;
  price_vs_fair_value: string | null;
}

export interface PrimerPortersScore {
  threat_of_substitutes: string | null;
  competitive_intensity: string | null;
  threat_of_new_entrants: string | null;
  bargaining_power_over_buyers: string | null;
  bargaining_power_over_suppliers: string | null;
}

export interface PrimerSmartScores {
  value: number | null;
  growth: number | null;
  dividend: number | null;
  momentum: number | null;
  resilience: number | null;
  overall_smart_score: number | null;
}

export interface StockPrimer {
  ticker: string;
  isin: string | null;
  pretty_name: string | null;
  created_at: string | null;

  // Narrative sections (arrays of HTML paragraphs)
  executive_summary: string[];
  three_bullish_points: string[];
  three_bearish_points: string[];
  company_overview: string[];
  industry_overview: string[];
  competitive_landscape: string[];
  financial_performance: string[];
  outlook: string[];
  management: string[];
  valuation_analysis: string[];
  swot_analysis: string[];
  key_risks: string[];
  smartkarma_smartscore_analysis: string[];
  smartkarma_analyst_comments: string[];
  growth_track_record: string[];
  dividend_summary: string[];
  key_products_and_services: string[] | null;

  // Structured data
  ratings: PrimerRatings | null;
  porters_five_forces_score: PrimerPortersScore | null;
  smart_scores_values: PrimerSmartScores | null;
}

// ─── Internal raw type ────────────────────────────────────────────────────────

interface RawPrimerData {
  ticker: string;
  isin?: string;
  pretty_name?: string;
  created_at?: string;
  executive_summary?: string[];
  three_bullish_points?: string[];
  three_bearish_points?: string[];
  company_overview?: string[];
  industry_overview?: string[];
  competitive_landscape?: string[];
  financial_performance?: string[];
  outlook?: string[];
  management?: string[];
  valuation_analysis?: string[];
  swot_analysis?: string[];
  key_risks?: string[];
  smartkarma_smartscore_analysis?: string[];
  smartkarma_analyst_comments?: string[];
  growth_track_record?: string[];
  dividend_summary?: string[];
  key_products_and_services?: string[] | null;
  ratings?: PrimerRatings;
  porters_five_forces_score?: PrimerPortersScore;
  smart_scores_values?: PrimerSmartScores;
}

interface RawPrimerResponse {
  ticker: string;
  status: "success" | "error" | "enqueued" | "processing";
  message: string;
  data: RawPrimerData[];
}

export type PrimerStatus = "success" | "enqueued" | "error";

export interface PrimerResult {
  status: PrimerStatus;
  primer: StockPrimer | null;
}

// ─── Fetch helper ─────────────────────────────────────────────────────────────

async function fetchPrimer(ticker: string, fresh = false): Promise<PrimerResult> {
  const url = `${PRIMER_BASE}/primer?api_token=${PRIMER_TOKEN}&ticker=${encodeURIComponent(ticker)}`;

  const res = await fetch(url, fresh ? { cache: "no-store" } : { next: { revalidate: 86400 } });

  if (!res.ok) {
    throw new Error(`Primer API error ${res.status} for ${ticker}`);
  }

  // Response is an array: first element is pagination meta, second is the result
  const raw = (await res.json()) as unknown[];
  const resultItem = raw.find(
    (item): item is RawPrimerResponse =>
      typeof item === "object" && item !== null && "status" in item
  );

  if (!resultItem) return { status: "error", primer: null };

  // Enqueued / processing — data is being generated
  if (resultItem.status !== "success" || !resultItem.data?.length) {
    const isEnqueued = resultItem.status === "enqueued" || resultItem.status === "processing"
      || (resultItem.message?.toLowerCase().includes("enqueue") ?? false)
      || (resultItem.message?.toLowerCase().includes("process") ?? false);
    return { status: isEnqueued ? "enqueued" : "error", primer: null };
  }

  const d = resultItem.data[0];

  const arr = (v: string[] | undefined | null): string[] => v ?? [];

  const primer: StockPrimer = {
    ticker: d.ticker,
    isin: d.isin ?? null,
    pretty_name: d.pretty_name ?? null,
    created_at: d.created_at ?? null,

    executive_summary: arr(d.executive_summary),
    three_bullish_points: arr(d.three_bullish_points),
    three_bearish_points: arr(d.three_bearish_points),
    company_overview: arr(d.company_overview),
    industry_overview: arr(d.industry_overview),
    competitive_landscape: arr(d.competitive_landscape),
    financial_performance: arr(d.financial_performance),
    outlook: arr(d.outlook),
    management: arr(d.management),
    valuation_analysis: arr(d.valuation_analysis),
    swot_analysis: arr(d.swot_analysis),
    key_risks: arr(d.key_risks),
    smartkarma_smartscore_analysis: arr(d.smartkarma_smartscore_analysis),
    smartkarma_analyst_comments: arr(d.smartkarma_analyst_comments),
    growth_track_record: arr(d.growth_track_record),
    dividend_summary: arr(d.dividend_summary),
    key_products_and_services: d.key_products_and_services ?? null,

    ratings: d.ratings ?? null,
    porters_five_forces_score: d.porters_five_forces_score ?? null,
    smart_scores_values: d.smart_scores_values ?? null,
  };

  return { status: "success", primer };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch the full Primer for a stock by its Bloomberg ticker (e.g. "D05 SP").
 * Returns null if the ticker isn't in the Primer database.
 * Cached at the Next.js fetch layer for 24h (primers update infrequently).
 */
export async function getPrimer(bloombergTicker: string): Promise<PrimerResult> {
  try {
    return await fetchPrimer(bloombergTicker);
  } catch {
    return { status: "error", primer: null };
  }
}

/** Same as getPrimer but bypasses the Next.js fetch cache — use for polling. */
export async function getPrimerFresh(bloombergTicker: string): Promise<PrimerResult> {
  try {
    return await fetchPrimer(bloombergTicker, true);
  } catch {
    return { status: "error", primer: null };
  }
}

/**
 * Strip HTML tags from primer text for plain-text contexts.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<table[\s\S]*?<\/table>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Extract author names from primer attribution links.
 * e.g. "[<a href='...'>Nicolas Baratte</a>]" → "Nicolas Baratte"
 */
export function extractAuthor(text: string): string | null {
  const match = text.match(/\[<a[^>]+>([^<]+)<\/a>\]/);
  return match ? match[1] : null;
}

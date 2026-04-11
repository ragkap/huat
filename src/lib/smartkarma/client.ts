const SK_TOKEN = process.env.SMARTKARMA_API_TOKEN!;
const SK_EMAIL = process.env.SMARTKARMA_API_EMAIL!;
const SK_API_BASE = process.env.SMARTKARMA_API_BASE ?? "https://www.smartkarma.com/api/v2";
const SK_DATA_BASE = process.env.SMARTKARMA_DATA_BASE ?? "https://datacloud1.smartkarma.com/v4";

const AUTH_HEADER = `Token token="${SK_TOKEN}", email="${SK_EMAIL}"`;

async function skFetch(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9",
      authorization: AUTH_HEADER,
      "x-sk-authorization": AUTH_HEADER,
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`SmartKarma API error ${res.status}: ${url}`);
  }

  return res.json();
}

export interface StockQuote {
  ticker: string;
  price: number | null;
  change: number | null;
  change_pct: number | null;
  volume: number | null;
  currency: string | null;
  last_updated: string | null;
}

export interface SmartScore {
  score: number | null;
  trend: string | null;
}

export interface ChartData {
  dates: string[];
  prices: number[];
}

export interface CurrentStats {
  pe_ratio: number | null;
  pb_ratio: number | null;
  market_cap: number | null;
  dividend_yield: number | null;
  week_52_high: number | null;
  week_52_low: number | null;
}

export async function getQuote(ticker: string): Promise<StockQuote> {
  try {
    const encodedTicker = encodeURIComponent(ticker);
    const data = (await skFetch(`${SK_API_BASE}/price-api/get-compact?ticker=${encodedTicker}`)) as Record<string, unknown>;
    return {
      ticker,
      price: (data.price as number) ?? null,
      change: (data.change as number) ?? null,
      change_pct: (data.change_pct as number) ?? null,
      volume: (data.volume as number) ?? null,
      currency: (data.currency as string) ?? null,
      last_updated: (data.last_updated as string) ?? null,
    };
  } catch {
    return { ticker, price: null, change: null, change_pct: null, volume: null, currency: null, last_updated: null };
  }
}

export async function getSmartScore(slug: string): Promise<SmartScore> {
  try {
    const data = (await skFetch(`${SK_API_BASE}/entities/${slug}/smart-score?`)) as Record<string, unknown>;
    return {
      score: (data.smart_score as number) ?? null,
      trend: (data.trend as string) ?? null,
    };
  } catch {
    return { score: null, trend: null };
  }
}

export async function getChart(ticker: string, yahooTicker: string, interval = "y1"): Promise<ChartData> {
  try {
    const encodedTicker = encodeURIComponent(ticker);
    const encodedYahoo = encodeURIComponent(yahooTicker);
    const data = (await skFetch(
      `${SK_API_BASE}/price-api/get-chart?ticker=${encodedTicker}&yahoo_ticker=${encodedYahoo}&interval=${interval}`
    )) as { dates?: string[]; prices?: number[] };
    return {
      dates: data.dates ?? [],
      prices: data.prices ?? [],
    };
  } catch {
    return { dates: [], prices: [] };
  }
}

export async function getCurrentStats(isin: string): Promise<CurrentStats> {
  try {
    const data = (await skFetch(`${SK_DATA_BASE}/financials/entities/${isin}/current-stats`)) as Record<string, unknown>;
    return {
      pe_ratio: (data.pe_ratio as number) ?? null,
      pb_ratio: (data.pb_ratio as number) ?? null,
      market_cap: (data.market_cap as number) ?? null,
      dividend_yield: (data.dividend_yield as number) ?? null,
      week_52_high: (data.week_52_high as number) ?? null,
      week_52_low: (data.week_52_low as number) ?? null,
    };
  } catch {
    return {
      pe_ratio: null,
      pb_ratio: null,
      market_cap: null,
      dividend_yield: null,
      week_52_high: null,
      week_52_low: null,
    };
  }
}

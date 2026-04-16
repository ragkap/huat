const SK_TOKEN = process.env.SMARTKARMA_API_TOKEN!;
const SK_EMAIL = process.env.SMARTKARMA_API_EMAIL!;
const SK_API_BASE = process.env.SMARTKARMA_API_BASE ?? "https://www.smartkarma.com/api/v2";
const SK_DATA_BASE = process.env.SMARTKARMA_DATA_BASE ?? "https://datacloud1.smartkarma.com/v4";

const AUTH_HEADER = `Token token="${SK_TOKEN}", email="${SK_EMAIL}"`;

async function skFetch(url: string, revalidate = 60): Promise<unknown> {
  const res = await fetch(url, {
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9",
      authorization: AUTH_HEADER,
      "x-sk-authorization": AUTH_HEADER,
    },
    next: { revalidate },
  });

  if (!res.ok) {
    throw new Error(`Smartkarma API error ${res.status}: ${url}`);
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
  year_high: number | null;
  year_low: number | null;
  pct_change_1m: number | null;
  pct_change_ytd: number | null;
}

export interface SmartScore {
  score: number | null;
  trend: string | null;
  value: number | null;
  dividend: number | null;
  growth: number | null;
  resilience: number | null;
  momentum: number | null;
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
}

export async function getQuote(ticker: string): Promise<StockQuote> {
  try {
    const encodedTicker = encodeURIComponent(ticker);
    const data = (await skFetch(`${SK_API_BASE}/price-api/get-compact?ticker=${encodedTicker}`)) as Record<string, unknown>;
    const parseNum = (v: unknown) => v != null && v !== "" ? Number(v) : null;
    return {
      ticker,
      price: parseNum(data.price),
      change: parseNum(data.netChange),
      change_pct: parseNum(data.percentage),
      volume: parseNum(data.volume),
      currency: (data.currency as string) ?? null,
      last_updated: data.lastPriceTime ? new Date((data.lastPriceTime as number) * 1000).toISOString() : null,
      year_high: parseNum(data.yearHigh),
      year_low: parseNum(data.yearLow),
      pct_change_1m: parseNum(data.pctChange1M),
      pct_change_ytd: parseNum(data.pctChangeYTD),
    };
  } catch {
    return { ticker, price: null, change: null, change_pct: null, volume: null, currency: null, last_updated: null, year_high: null, year_low: null, pct_change_1m: null, pct_change_ytd: null };
  }
}

export async function getSmartScore(slug: string): Promise<SmartScore> {
  try {
    const res = (await skFetch(`${SK_API_BASE}/entities/${slug}/smart-score?`, 3600)) as
      { data?: { attributes?: Record<string, unknown> } } & Record<string, unknown>;
    const attrs: Record<string, unknown> = res.data?.attributes ?? res;
    return {
      score: (attrs["country-and-sector-score"] as number) ?? (attrs["country-score"] as number) ?? (attrs.smart_score as number) ?? null,
      trend: (attrs.trend as string) ?? null,
      value: (attrs["country-and-sector-value"] as number) ?? null,
      dividend: (attrs["country-and-sector-dividend"] as number) ?? null,
      growth: (attrs["country-and-sector-growth"] as number) ?? null,
      resilience: (attrs["country-and-sector-resilience"] as number) ?? null,
      momentum: (attrs["country-and-sector-momentum"] as number) ?? null,
    };
  } catch {
    return { score: null, trend: null, value: null, dividend: null, growth: null, resilience: null, momentum: null };
  }
}

export async function getChart(ticker: string, yahooTicker: string, interval = "y1"): Promise<ChartData> {
  try {
    const encodedTicker = encodeURIComponent(ticker);
    const encodedYahoo = encodeURIComponent(yahooTicker);
    const data = (await skFetch(
      `${SK_API_BASE}/price-api/get-chart?ticker=${encodedTicker}&yahoo_ticker=${encodedYahoo}&interval=${interval}`,
      3600
    )) as { close?: number[]; time_period?: string[] };
    return {
      dates: data.time_period ?? [],
      prices: data.close ?? [],
    };
  } catch {
    return { dates: [], prices: [] };
  }
}

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  description: string;
}

export async function getNews(keyword: string): Promise<NewsItem[]> {
  try {
    const encoded = encodeURIComponent(keyword);
    const data = (await skFetch(
      `${SK_DATA_BASE.replace("/v4", "/v3")}/news/search/${encoded}`,
      300
    )) as { news?: NewsItem[] };
    return data.news ?? [];
  } catch {
    return [];
  }
}

export interface AnnouncementItem {
  title: string;
  attachments: string[];
  pubDate: string;
}

export async function getAnnouncements(slug: string): Promise<AnnouncementItem[]> {
  try {
    const data = (await skFetch(
      `${SK_API_BASE}/entities/${encodeURIComponent(slug)}/exchange-announcements?include=entity&page%5Bsize%5D=20&page%5Bnumber%5D=1&sort=-release-time`,
      300
    )) as { data?: { attributes: { title: string; "release-time": string; attachment: string[] } }[] };
    return (data.data ?? [])
      .filter(item => item.attributes.attachment?.length > 0)
      .map(item => ({
        title: item.attributes.title,
        attachments: item.attributes.attachment,
        pubDate: item.attributes["release-time"],
      }));
  } catch {
    return [];
  }
}

export async function getCurrentStats(isin: string): Promise<CurrentStats> {
  try {
    const data = (await skFetch(`${SK_DATA_BASE}/financials/entities/${isin}/current-stats`, 3600)) as Record<string, unknown>;
    return {
      pe_ratio: (data.pe as number) ?? null,
      pb_ratio: (data.pb as number) ?? null,
      market_cap: (data.market_value_usd as number) ?? null,
      dividend_yield: (data.div_yld as number) ?? null,
    };
  } catch {
    return { pe_ratio: null, pb_ratio: null, market_cap: null, dividend_yield: null };
  }
}

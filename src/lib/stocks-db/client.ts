import { Pool } from "pg";
import { unstable_cache } from "next/cache";

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.STOCKS_DB_HOST,
      port: Number(process.env.STOCKS_DB_PORT ?? 5432),
      database: process.env.STOCKS_DB_NAME,
      user: process.env.STOCKS_DB_USER,
      password: process.env.STOCKS_DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 8000,
    });
  }
  return pool;
}

export interface SGStock {
  id: number;
  name: string;
  bloomberg_ticker: string | null;
  exchange_code: string | null;
  sector: string | null;
  isin: string | null;
  slug: string | null;
  yahoo_ticker: string | null;
  market_status: string | null;
  description: string | null;
  market_cap: number | null;
  smart_score: number | null;
}

const BASE_SELECT = `
  SELECT
    e.id,
    e.pretty_name AS name,
    e.bloomberg_ticker,
    e.exchange_code,
    e.sector,
    e.isin,
    e.slug,
    e.yahoo_ticker,
    e.market_status,
    e.description,
    e.market_cap,
    ess.country_score AS smart_score
  FROM entities e
  LEFT OUTER JOIN entity_smart_scores ess ON ess.entity_id = e.id
  WHERE e.exchange_code = 'SP'
    AND (e.market_status IN ('listed', 'pending-listing') OR e.market_status IS NULL)
    AND e.bloomberg_ticker NOT LIKE 'SK %'
    AND e.sector IS NOT NULL
    AND e.sector != ''
`;

async function _getSingaporeStocks(): Promise<SGStock[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query<SGStock>(
      `${BASE_SELECT}
       ORDER BY e.market_cap DESC NULLS LAST`
    );
    return result.rows;
  } finally {
    client.release();
  }
}

export const getSingaporeStocks = unstable_cache(
  _getSingaporeStocks,
  ["sg-stocks-v4"],
  { revalidate: 300 }
);

export async function searchStocks(query: string, limit = 20): Promise<SGStock[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query<SGStock>(
      `${BASE_SELECT}
       AND (
         e.pretty_name ILIKE $1
         OR e.bloomberg_ticker ILIKE $1
         OR e.slug ILIKE $1
       )
       ORDER BY
         CASE WHEN e.bloomberg_ticker ILIKE $2 THEN 0 ELSE 1 END,
         e.market_cap DESC NULLS LAST
       LIMIT $3`,
      [`%${query}%`, `${query}%`, limit]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

async function _getStockNamesByTickers(tickers: string[]): Promise<Record<string, string>> {
  if (!tickers.length) return {};
  const client = await getPool().connect();
  try {
    const placeholders = tickers.map((_, i) => `$${i + 1}`).join(", ");
    const result = await client.query<{ bloomberg_ticker: string; name: string }>(
      `SELECT e.bloomberg_ticker, e.pretty_name AS name
       FROM entities e
       WHERE e.bloomberg_ticker = ANY(ARRAY[${placeholders}]::text[])`,
      tickers
    );
    const map: Record<string, string> = {};
    for (const row of result.rows) {
      if (row.bloomberg_ticker) map[row.bloomberg_ticker] = row.name;
    }
    return map;
  } finally {
    client.release();
  }
}

export const getStockNamesByTickers = unstable_cache(
  _getStockNamesByTickers,
  ["stock-names"],
  { revalidate: 300 }
);

export interface StockIdentity {
  slug: string;
  bloomberg_ticker: string;
  name: string;
  yahoo_ticker: string | null;
}

export async function getStocksBySlugs(slugs: string[]): Promise<StockIdentity[]> {
  if (!slugs.length) return [];
  const client = await getPool().connect();
  try {
    const placeholders = slugs.map((_, i) => `$${i + 1}`).join(", ");
    const result = await client.query<StockIdentity>(
      `SELECT e.slug, e.bloomberg_ticker, e.pretty_name AS name, e.yahoo_ticker
       FROM entities e
       WHERE e.slug = ANY(ARRAY[${placeholders}]::text[])`,
      slugs
    );
    return result.rows;
  } finally {
    client.release();
  }
}

export interface ResearchItem {
  tagline: string;
  executive_summary: string;
  url: string;
  author: string;
  published_at: string;
}

export async function getResearchForTicker(bloombergTicker: string, limit = 20): Promise<ResearchItem[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query<ResearchItem>(
      `SELECT
         i.tagline,
         i.executive_summary,
         'https://www.smartkarma.com/insights/' || i.slug AS url,
         a.name AS author,
         i.published_at
       FROM insights i
       INNER JOIN entities e ON i.primary_entity_id = e.id
       INNER JOIN accounts a ON a.id = i.account_id
       WHERE e.exchange_code = 'SP'
         AND (e.market_status IN ('listed', 'pending-listing') OR e.market_status IS NULL)
         AND e.bloomberg_ticker = $1
         AND i.aasm_state = 'published'
       ORDER BY i.created_at DESC
       LIMIT $2`,
      [bloombergTicker, limit]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

async function _getStockBySlugOrTicker(identifier: string): Promise<SGStock | null> {
  const client = await getPool().connect();
  try {
    const result = await client.query<SGStock>(
      `${BASE_SELECT}
       AND (
         e.slug = $1
         OR LOWER(e.bloomberg_ticker) = LOWER($1)
         OR e.bloomberg_ticker ILIKE $2
       )
       LIMIT 1`,
      [identifier, `${identifier} %`]
    );
    return result.rows[0] ?? null;
  } finally {
    client.release();
  }
}

export const getStockBySlugOrTicker = unstable_cache(
  _getStockBySlugOrTicker,
  ["stock-by-id"],
  { revalidate: 3600 }
);

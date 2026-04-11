import { Pool } from "pg";

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
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

export interface SGStock {
  ticker: string;
  name: string;
  exchange: string;
  sector: string | null;
  isin: string | null;
  slug: string | null;
}

export async function getSingaporeStocks(limit = 500): Promise<SGStock[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query<SGStock>(
      `SELECT
        e.ticker,
        e.name,
        e.exchange,
        e.sector,
        e.isin,
        e.slug
      FROM entities e
      WHERE e.country = 'Singapore'
        AND e.is_active = true
      ORDER BY e.name ASC
      LIMIT $1`,
      [limit]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

export async function searchStocks(query: string, limit = 20): Promise<SGStock[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query<SGStock>(
      `SELECT
        e.ticker,
        e.name,
        e.exchange,
        e.sector,
        e.isin,
        e.slug
      FROM entities e
      WHERE e.country = 'Singapore'
        AND e.is_active = true
        AND (
          e.name ILIKE $1
          OR e.ticker ILIKE $1
        )
      ORDER BY
        CASE WHEN e.ticker ILIKE $2 THEN 0 ELSE 1 END,
        e.name ASC
      LIMIT $3`,
      [`%${query}%`, `${query}%`, limit]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

export async function getStockByTicker(ticker: string): Promise<SGStock | null> {
  const client = await getPool().connect();
  try {
    const result = await client.query<SGStock>(
      `SELECT
        e.ticker,
        e.name,
        e.exchange,
        e.sector,
        e.isin,
        e.slug
      FROM entities e
      WHERE e.country = 'Singapore'
        AND (e.ticker = $1 OR e.slug = $1)
      LIMIT 1`,
      [ticker]
    );
    return result.rows[0] ?? null;
  } finally {
    client.release();
  }
}

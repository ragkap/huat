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
}

const BASE_SELECT = `
  SELECT
    e.id,
    e.short_name AS name,
    e.bloomberg_ticker,
    e.exchange_code,
    e.sector,
    e.isin,
    e.slug,
    e.yahoo_ticker
  FROM entities e
  WHERE e.country = 'Singapore'
    AND e.public = true
    AND e.bloomberg_ticker IS NOT NULL
    AND e.bloomberg_ticker != ''
`;

export async function getSingaporeStocks(limit = 500): Promise<SGStock[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query<SGStock>(
      `${BASE_SELECT}
       ORDER BY e.short_name ASC
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
      `${BASE_SELECT}
       AND (
         e.short_name ILIKE $1
         OR e.bloomberg_ticker ILIKE $1
         OR e.slug ILIKE $1
       )
       ORDER BY
         CASE WHEN e.bloomberg_ticker ILIKE $2 THEN 0 ELSE 1 END,
         e.short_name ASC
       LIMIT $3`,
      [`%${query}%`, `${query}%`, limit]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

export async function getStockBySlugOrTicker(identifier: string): Promise<SGStock | null> {
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

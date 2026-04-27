import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getResearchForTicker, imperativeToSentiment } from "@/lib/stocks-db/client";

const CRON_SECRET = process.env.CRON_SECRET;

// Tunables
const MAX_TICKERS_PER_RUN = 30;
const MAX_POSTS_PER_TICKER = 1;
const MAX_AGE_DAYS = 7;          // ignore research older than this
const ACTIVE_LOOKBACK_DAYS = 30; // tickers in posts within this window count as "active"

const BOT_EMAIL = "huat-research@huat.co";
const BOT_USERNAME = "huat-research";
const BOT_DISPLAY_NAME = "Huat Research";
const BOT_BIO = "Auto-posted research insights from Smartkarma. Discuss in replies.";

interface ResearchCandidate {
  ticker: string;
  url: string;
  tagline: string;
  excerpt: string;
  author: string;
  publishedAt: string;
  sentiment: "bullish" | "bearish" | "neutral";
}

// Smartkarma's executive_summary is HTML — convert to readable plain text
// before we paste it into a post (posts render as text, not HTML).
function htmlToPlain(html: string): string {
  return html
    // drop tables outright — usually not useful in a 200-char excerpt
    .replace(/<table[\s\S]*?<\/table>/gi, "")
    // bullets: turn each <li> into a "• " line
    .replace(/<\s*li[^>]*>/gi, "\n• ")
    .replace(/<\s*\/li\s*>/gi, "")
    // block breaks
    .replace(/<\s*\/?(p|div|ul|ol|h[1-6]|tr)[^>]*>/gi, "\n")
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    // strip remaining tags
    .replace(/<[^>]+>/g, "")
    // decode common entities
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // collapse runs of whitespace and tidy newlines
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s+|\s+$/g, "");
}

function buildPostContent(ticker: string, _tagline: string, excerpt: string): string {
  // The link card carries the tagline — body shows the first 200 chars of the
  // excerpt so the reader has something concrete to react to.
  const cleanExcerpt = htmlToPlain(excerpt ?? "");
  const truncated = cleanExcerpt.length > 200 ? cleanExcerpt.slice(0, 197) + "…" : cleanExcerpt;
  if (!truncated) return `📊 New research on ${ticker}`;
  return `📊 ${ticker}\n\n${truncated}`;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // ── 1. Idempotently ensure the @huat-research bot exists. ────────────────
  let botId: string;
  {
    const { data: existing } = await db
      .from("profiles")
      .select("id")
      .eq("username", BOT_USERNAME)
      .maybeSingle();

    if (existing) {
      botId = (existing as { id: string }).id;
    } else {
      const { data: created, error: createErr } = await db.auth.admin.createUser({
        email: BOT_EMAIL,
        email_confirm: true,
        user_metadata: { full_name: BOT_DISPLAY_NAME },
      });
      if (createErr || !created.user) {
        return NextResponse.json({ error: `Failed to create bot user: ${createErr?.message}` }, { status: 500 });
      }
      botId = created.user.id;
      const { error: updateErr } = await db.from("profiles").update({
        username: BOT_USERNAME,
        display_name: BOT_DISPLAY_NAME,
        bio: BOT_BIO,
        is_verified: true,
        is_bot: true,
        bot_description: BOT_BIO,
        country: "SG",
      }).eq("id", botId);
      if (updateErr) {
        return NextResponse.json({ error: `Failed to set bot profile: ${updateErr.message}` }, { status: 500 });
      }
    }
  }

  // ── 2. Find active tickers (same logic as post-announcements). ───────────
  const since = new Date(Date.now() - ACTIVE_LOOKBACK_DAYS * 86400_000).toISOString();
  const [watchlistRes, postsRes] = await Promise.all([
    db.from("stock_watchlist").select("ticker").limit(5000),
    db.from("posts").select("tagged_stocks").gte("created_at", since).limit(2000),
  ]);

  const tickerSet = new Set<string>();
  for (const row of (watchlistRes.data ?? []) as { ticker: string }[]) {
    if (row.ticker) tickerSet.add(row.ticker);
  }
  for (const row of (postsRes.data ?? []) as { tagged_stocks: string[] | null }[]) {
    for (const t of row.tagged_stocks ?? []) tickerSet.add(t);
  }
  const tickers = Array.from(tickerSet).slice(0, MAX_TICKERS_PER_RUN);
  if (!tickers.length) return NextResponse.json({ posted: 0, reason: "no active tickers" });

  // ── 3. Fetch research per ticker. ────────────────────────────────────────
  const cutoff = Date.now() - MAX_AGE_DAYS * 86400_000;
  const candidates: ResearchCandidate[] = [];

  await Promise.all(
    tickers.map(async ticker => {
      const items = await getResearchForTicker(ticker, 5).catch(() => []);
      for (const item of items) {
        const ms = Date.parse(item.published_at);
        if (!Number.isFinite(ms) || ms < cutoff) continue;
        if (!item.tagline || !item.url) continue;
        candidates.push({
          ticker,
          url: item.url,
          tagline: item.tagline,
          excerpt: item.executive_summary ?? "",
          author: item.author,
          publishedAt: item.published_at,
          sentiment: imperativeToSentiment(item.imperative),
        });
      }
    }),
  );

  if (!candidates.length) return NextResponse.json({ posted: 0, reason: "no fresh research" });

  // ── 4. Skip ones we've already posted. ───────────────────────────────────
  const { data: alreadyPosted } = await db
    .from("research_posts")
    .select("research_url")
    .in("research_url", candidates.map(c => c.url));
  const seen = new Set(((alreadyPosted ?? []) as { research_url: string }[]).map(r => r.research_url));

  const fresh = candidates
    .filter(c => !seen.has(c.url))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

  // Per-ticker cap.
  const perTickerCount = new Map<string, number>();
  const toPost: ResearchCandidate[] = [];
  for (const c of fresh) {
    const count = perTickerCount.get(c.ticker) ?? 0;
    if (count >= MAX_POSTS_PER_TICKER) continue;
    perTickerCount.set(c.ticker, count + 1);
    toPost.push(c);
  }

  if (!toPost.length) return NextResponse.json({ posted: 0, reason: "all candidates already posted" });

  // ── 5. Post + record dedupe key. ─────────────────────────────────────────
  let posted = 0;
  for (const c of toPost) {
    const attachment = {
      url: c.url,
      type: "link" as const,
      og_title: c.tagline,
      og_description: c.author ? `Research by ${c.author} · Smartkarma` : "Smartkarma research",
      og_site_name: "Smartkarma",
    };

    const { data: post, error: postErr } = await db
      .from("posts")
      .insert({
        author_id: botId,
        content: buildPostContent(c.ticker, c.tagline, c.excerpt),
        post_type: "post",
        sentiment: c.sentiment,
        tagged_stocks: [c.ticker],
        attachments: [attachment],
      })
      .select("id")
      .single();

    if (postErr || !post) {
      console.error("post-research insert failed", c.ticker, postErr?.message);
      continue;
    }

    await db.from("research_posts").upsert({
      research_url: c.url,
      ticker: c.ticker,
      post_id: (post as { id: string }).id,
    }, { onConflict: "research_url", ignoreDuplicates: true });

    posted++;
  }

  return NextResponse.json({
    botId,
    tickers: tickers.length,
    candidates: candidates.length,
    posted,
  });
}

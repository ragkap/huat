import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getAnnouncements } from "@/lib/smartkarma/client";
import { getStockIdentitiesByTickers } from "@/lib/stocks-db/client";

const CRON_SECRET = process.env.CRON_SECRET;

// Tunables
const MAX_TICKERS_PER_RUN = 50;       // cap how many tickers we touch per run
const MAX_POSTS_PER_TICKER = 1;       // never spam — at most one announcement post per ticker per run
const MAX_AGE_HOURS = 24;             // ignore announcements older than this
const ACTIVE_LOOKBACK_DAYS = 30;      // tickers in posts within this window count as "active"

// @huat-news bot identity
const BOT_EMAIL = "huat-news@huat.co";
const BOT_USERNAME = "huat-news";
const BOT_DISPLAY_NAME = "Huat News";
const BOT_BIO = "Auto-posted exchange announcements. Discuss in replies.";

interface AnnouncementWithKey {
  ticker: string;
  slug: string;
  stockName: string;
  title: string;
  pubDate: string;
  attachmentUrl: string;
  key: string;
}

function announcementKey(title: string, pubDate: string): string {
  return createHash("sha256").update(`${title}|${pubDate}`).digest("hex").slice(0, 32);
}

function buildPostContent(stockName: string, ticker: string, title: string): string {
  // Keep it short — leave room for replies, not editorial.
  const cleanTitle = title.length > 200 ? title.slice(0, 197) + "..." : title;
  return `📢 ${stockName} (${ticker})\n\n${cleanTitle}`;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // ── 1. Idempotently ensure the @huat-news bot profile exists. ─────────────
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
      // Create the auth user. The handle_new_user trigger creates a stub
      // profile; we then update it to the canonical bot fields.
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
        country: "SG",
      }).eq("id", botId);
      if (updateErr) {
        return NextResponse.json({ error: `Failed to set bot profile: ${updateErr.message}` }, { status: 500 });
      }
    }
  }

  // ── 2. Find tickers the community cares about. ────────────────────────────
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

  // ── 3. Fetch announcements per ticker. ────────────────────────────────────
  const identities = await getStockIdentitiesByTickers(tickers);
  const identityByTicker = new Map<string, typeof identities[number]>();
  for (const id of identities) identityByTicker.set(id.bloomberg_ticker, id);

  const cutoff = Date.now() - MAX_AGE_HOURS * 3600_000;
  const candidates: AnnouncementWithKey[] = [];

  await Promise.all(
    tickers.map(async ticker => {
      const id = identityByTicker.get(ticker);
      if (!id?.slug) return;
      const items = await getAnnouncements(id.slug).catch(() => []);
      for (const item of items) {
        const pubMs = Date.parse(item.pubDate);
        if (!Number.isFinite(pubMs) || pubMs < cutoff) continue;
        const url = item.attachments[0];
        if (!url) continue;
        candidates.push({
          ticker,
          slug: id.slug,
          stockName: id.name,
          title: item.title,
          pubDate: item.pubDate,
          attachmentUrl: url,
          key: announcementKey(item.title, item.pubDate),
        });
      }
    }),
  );

  if (!candidates.length) return NextResponse.json({ posted: 0, reason: "no fresh announcements" });

  // ── 4. Skip ones we've already posted. ────────────────────────────────────
  const { data: alreadyPosted } = await db
    .from("announcement_posts")
    .select("ticker, announcement_key")
    .in("announcement_key", candidates.map(c => c.key));
  const seen = new Set(
    ((alreadyPosted ?? []) as { ticker: string; announcement_key: string }[])
      .map(r => `${r.ticker}|${r.announcement_key}`),
  );

  const fresh = candidates
    .filter(c => !seen.has(`${c.ticker}|${c.key}`))
    .sort((a, b) => Date.parse(b.pubDate) - Date.parse(a.pubDate));

  // Per-ticker cap, then post.
  const perTickerCount = new Map<string, number>();
  const toPost: AnnouncementWithKey[] = [];
  for (const c of fresh) {
    const count = perTickerCount.get(c.ticker) ?? 0;
    if (count >= MAX_POSTS_PER_TICKER) continue;
    perTickerCount.set(c.ticker, count + 1);
    toPost.push(c);
  }

  if (!toPost.length) return NextResponse.json({ posted: 0, reason: "all candidates already posted" });

  // ── 5. Post + record dedupe key. ──────────────────────────────────────────
  let posted = 0;
  for (const c of toPost) {
    const attachment = {
      url: c.attachmentUrl,
      type: "link" as const,
      og_title: c.title,
      og_description: `${c.stockName} (${c.ticker}) · Exchange announcement`,
      og_site_name: "SGX Announcement",
    };

    const { data: post, error: postErr } = await db
      .from("posts")
      .insert({
        author_id: botId,
        content: buildPostContent(c.stockName, c.ticker, c.title),
        post_type: "post",
        sentiment: "neutral",
        tagged_stocks: [c.ticker],
        attachments: [attachment],
      })
      .select("id")
      .single();

    if (postErr || !post) {
      console.error("post-announcements insert failed", c.ticker, postErr?.message);
      continue;
    }

    await db.from("announcement_posts").upsert({
      ticker: c.ticker,
      announcement_key: c.key,
      post_id: (post as { id: string }).id,
    }, { onConflict: "ticker,announcement_key", ignoreDuplicates: true });

    posted++;
  }

  return NextResponse.json({
    botId,
    tickers: tickers.length,
    candidates: candidates.length,
    posted,
  });
}

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const CRON_SECRET = process.env.CRON_SECRET;

const BOT_EMAIL = "huat-questions@huat.co";
const BOT_USERNAME = "huat-questions";
const BOT_DISPLAY_NAME = "Huat Questions";
const BOT_BIO = "Daily prompts for the community. Reply with your hottest take.";

// Hand-curated rotation. Cron picks one per day deterministically by
// (day-of-year mod questions.length), so the rotation is predictable and
// you can preview the next ~N days by reading down this list.
const QUESTIONS: string[] = [
  "What's your top SGX pick for the week — and why?",
  "Which Singapore stock are you accumulating on dips right now?",
  "Banks (DBS / OCBC / UOB) — which one's the best buy today?",
  "REITs are back in fashion. Which one are you holding into 2026?",
  "What's a contrarian SGX call you'd defend in public?",
  "If you had S$10k to deploy on SGX today, where does it go?",
  "Which SGX small-cap is criminally underfollowed?",
  "Best dividend stock on SGX right now — name your pick.",
  "Tech vs banks for the rest of the year — which wins?",
  "Which stock would you tell your parents to never sell?",
  "What's the biggest macro risk you're pricing in this quarter?",
  "Singtel — value trap or sleeping giant?",
  "Sea Ltd — bull case or bear case in one sentence?",
  "Best earnings surprise this season? Worst?",
  "Which sector is most overhyped on SGX right now?",
  "Most beaten-down stock on your watchlist — buying or avoiding?",
  "What's your favourite SGX-listed family-run business?",
  "If SGX listed one new IPO tomorrow, what would you want it to be?",
  "Which non-Singapore stock should every SG investor own?",
  "Lot size or fractional — how are you actually buying?",
  "Best brokerage for SG retail investors — fight me.",
  "What's your unpopular opinion on SREITs?",
  "How are you positioning ahead of the Fed's next move?",
  "Genting SP — gambling on the gambler. Are you in?",
  "Which CEO on SGX would you trust your money with?",
  "What's the first stock you ever bought? Still hold it?",
  "Crypto in your portfolio — yes, no, how much?",
  "If rates drop in 2026, what wins on SGX?",
  "Stock you regret selling too early?",
  "Most confident high-conviction call in your portfolio right now?",
];

function pickQuestion(date: Date): string {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start) / 86400000);
  return QUESTIONS[dayOfYear % QUESTIONS.length];
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // ── 1. Idempotently ensure the @huat-questions bot exists. ───────────────
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

  // ── 2. Pick today's question. Skip if the bot already posted today. ──────
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { data: alreadyPosted } = await db
    .from("posts")
    .select("id")
    .eq("author_id", botId)
    .gte("created_at", todayStart.toISOString())
    .limit(1);

  if (alreadyPosted && alreadyPosted.length > 0) {
    return NextResponse.json({ posted: 0, reason: "already posted today" });
  }

  const question = pickQuestion(new Date());

  const { data: post, error: postErr } = await db
    .from("posts")
    .insert({
      author_id: botId,
      content: question,
      post_type: "post",
      sentiment: "neutral",
      tagged_stocks: [],
      attachments: [],
    })
    .select("id")
    .single();

  if (postErr || !post) {
    return NextResponse.json({ error: postErr?.message ?? "Insert failed" }, { status: 500 });
  }

  return NextResponse.json({ botId, posted: 1, question, postId: (post as { id: string }).id });
}

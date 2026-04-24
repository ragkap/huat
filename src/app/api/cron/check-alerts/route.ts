import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getQuote } from "@/lib/smartkarma/client";
import { resend, FROM_EMAIL } from "@/lib/email/client";
import { huatEmail } from "@/lib/email/template";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Get all active alerts
  const { data: alerts } = await db
    .from("price_alerts")
    .select("*, profile:profiles!price_alerts_user_id_fkey(display_name)")
    .eq("triggered", false);

  if (!alerts?.length) return NextResponse.json({ checked: 0, triggered: 0 });

  // Group by ticker to minimize API calls
  const byTicker: Record<string, typeof alerts> = {};
  for (const a of alerts) {
    (byTicker[a.ticker] ??= []).push(a);
  }

  let triggered = 0;

  for (const [ticker, tickerAlerts] of Object.entries(byTicker)) {
    const quote = await getQuote(ticker).catch(() => null);
    if (!quote?.price) continue;

    for (const alert of tickerAlerts) {
      const hit =
        (alert.direction === "above" && quote.price >= alert.target_price) ||
        (alert.direction === "below" && quote.price <= alert.target_price);

      if (hit) {
        // Mark as triggered
        await db.from("price_alerts").update({ triggered: true }).eq("id", alert.id);

        // Get user email
        const { data: userData } = await db.auth.admin.getUserById(alert.user_id);
        const email = userData?.user?.email;
        if (!email) continue;

        const displayTicker = ticker.replace(/ SP$/, "");
        const directionText = alert.direction === "above" ? "risen above" : "fallen below";

        await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: `${displayTicker} has ${directionText} $${alert.target_price}`,
          html: huatEmail({
            preheader: `${displayTicker} is now at $${quote.price.toFixed(2)}`,
            heading: `Price alert: ${displayTicker}`,
            body: `
              <p style="color:#9CA3AF">
                <strong style="color:#F0F0F0">${displayTicker}</strong> has ${directionText} your target of
                <strong style="color:#F0F0F0">$${Number(alert.target_price).toFixed(2)}</strong>.
              </p>
              <p style="color:#22C55E;font-size:28px;font-weight:900;margin:16px 0">
                $${quote.price.toFixed(2)}
              </p>
              <p style="color:#71717A;font-size:13px">
                ${quote.change_pct != null ? `${quote.change_pct >= 0 ? "+" : ""}${quote.change_pct.toFixed(2)}% today` : ""}
              </p>
            `,
            ctaText: `View ${displayTicker} on Huat`,
            ctaUrl: `https://www.huat.co/stocks/${encodeURIComponent(ticker)}`,
            footerExtra: "Prices may be delayed and are provided for informational purposes only. Always verify with your broker before making investment decisions. Huat does not provide financial advice and accepts no responsibility for trading decisions.",
          }),
        }).catch(() => {});

        triggered++;
      }
    }
  }

  return NextResponse.json({ checked: alerts.length, triggered });
}

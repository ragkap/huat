import { createClient } from "@supabase/supabase-js";
import { resend, FROM_EMAIL } from "./client";
import { huatEmail } from "./template";

const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Check if user has email preference enabled and isn't paused
async function shouldSend(userId: string, prefKey: string): Promise<{ send: boolean; email: string | null }> {
  const admin = db();
  const [prefsRes, userRes] = await Promise.all([
    admin.from("email_preferences").select("*").eq("user_id", userId).single(),
    admin.auth.admin.getUserById(userId),
  ]);

  const prefs = prefsRes.data as Record<string, boolean> | null;
  const email = userRes.data?.user?.email ?? null;

  if (!email) return { send: false, email: null };
  if (!prefs) return { send: true, email }; // No prefs row = defaults (all on)
  if (prefs.pause_all) return { send: false, email };
  if (prefs[prefKey] === false) return { send: false, email };

  return { send: true, email };
}

export async function sendNewMessageEmail(recipientId: string, senderName: string, messagePreview: string) {
  const { send, email } = await shouldSend(recipientId, "new_message");
  if (!send || !email) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `${senderName} sent you a message on Huat`,
    html: huatEmail({
      preheader: messagePreview.slice(0, 80),
      heading: `New message from ${senderName}`,
      body: `
        <p style="color:#F0F0F0;background:#1C1C1C;border:1px solid #282828;border-radius:8px;padding:12px 16px;font-size:14px;margin:0 0 16px 0">
          "${messagePreview.slice(0, 200)}${messagePreview.length > 200 ? "…" : ""}"
        </p>
      `,
      ctaText: "Reply on Huat",
      ctaUrl: "https://www.huat.co/messages",
    }),
  });
}

export async function sendNewFollowerEmail(recipientId: string, followerName: string, followerUsername: string) {
  const { send, email } = await shouldSend(recipientId, "new_follower");
  if (!send || !email) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `${followerName} is now following you on Huat`,
    html: huatEmail({
      preheader: `${followerName} (@${followerUsername}) started following you`,
      heading: `${followerName} followed you`,
      body: `
        <p style="color:#9CA3AF">
          <strong style="color:#F0F0F0">${followerName}</strong>
          <span style="color:#555555;margin-left:6px">@${followerUsername}</span>
        </p>
        <p style="color:#9CA3AF;margin-top:8px">They'll see your posts in their feed. Check out their profile and follow back if you'd like.</p>
      `,
      ctaText: `View ${followerName}'s profile`,
      ctaUrl: `https://www.huat.co/profile/${followerUsername}`,
    }),
  });
}

export async function sendConnectRequestEmail(recipientId: string, requesterName: string, requesterUsername: string) {
  const { send, email } = await shouldSend(recipientId, "connect_request");
  if (!send || !email) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `${requesterName} wants to connect on Huat`,
    html: huatEmail({
      preheader: `Accept to start messaging with ${requesterName}`,
      heading: `Connection request from ${requesterName}`,
      body: `
        <p style="color:#9CA3AF">
          <strong style="color:#F0F0F0">${requesterName}</strong>
          <span style="color:#555555;margin-left:6px">@${requesterUsername}</span>
        </p>
        <p style="color:#9CA3AF;margin-top:8px">Accept their request to start messaging and share insights together.</p>
      `,
      ctaText: "View request",
      ctaUrl: "https://www.huat.co/notifications",
    }),
  });
}

export async function sendConnectAcceptedEmail(recipientId: string, accepterName: string, accepterUsername: string) {
  const { send, email } = await shouldSend(recipientId, "connect_accepted");
  if (!send || !email) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `${accepterName} accepted your connection on Huat`,
    html: huatEmail({
      preheader: `You can now message ${accepterName}`,
      heading: `You're connected with ${accepterName}`,
      body: `
        <p style="color:#9CA3AF">
          <strong style="color:#F0F0F0">${accepterName}</strong> accepted your connection request.
          You can now message each other directly.
        </p>
      `,
      ctaText: `Message ${accepterName}`,
      ctaUrl: "https://www.huat.co/messages",
    }),
  });
}

export async function sendPostReplyEmail(recipientId: string, replierName: string, postPreview: string, postId: string) {
  const { send, email } = await shouldSend(recipientId, "post_reply");
  if (!send || !email) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `${replierName} replied to your post on Huat`,
    html: huatEmail({
      preheader: postPreview.slice(0, 80),
      heading: `${replierName} replied to your post`,
      body: `
        <p style="color:#F0F0F0;background:#1C1C1C;border:1px solid #282828;border-radius:8px;padding:12px 16px;font-size:14px;margin:0 0 16px 0">
          "${postPreview.slice(0, 200)}${postPreview.length > 200 ? "…" : ""}"
        </p>
      `,
      ctaText: "View conversation",
      ctaUrl: `https://www.huat.co/post/${postId}`,
    }),
  });
}

export async function sendAngBaoMilestoneEmail(userId: string, milestone: number) {
  const { send, email } = await shouldSend(userId, "angbao_milestone");
  if (!send || !email) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `You've reached ${milestone} AngBao on Huat`,
    html: huatEmail({
      preheader: `Your social currency on Huat just hit a milestone`,
      heading: `${milestone} AngBao reached`,
      body: `
        <p style="text-align:center;margin:0 0 20px 0">
          <span style="font-size:48px">🧧</span>
        </p>
        <p style="color:#22C55E;font-size:32px;font-weight:900;text-align:center;margin:0 0 8px 0">
          $${milestone}
        </p>
        <p style="color:#9CA3AF;text-align:center;margin:0 0 20px 0">
          Your AngBao balance has reached a new milestone. Keep posting, engaging, and inviting friends to grow your social currency.
        </p>
      `,
      ctaText: "Invite friends to earn more",
      ctaUrl: "https://www.huat.co/feed",
      footerExtra: "AngBao is social currency on Huat — not real money.",
    }),
  });
}

export async function sendWeeklyDigestEmail(
  userId: string,
  stats: { reactions: number; followers: number; replies: number; angbaoEarned: number },
  topPosts: { author: string; content: string; postId: string }[],
  trendingStocks: { name: string; ticker: string; postCount: number }[]
) {
  const { send, email } = await shouldSend(userId, "weekly_digest");
  if (!send || !email) return;

  const statsHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0">
      <tr>
        <td style="background:#1C1C1C;border:1px solid #282828;border-radius:8px;padding:16px;text-align:center;width:25%">
          <p style="color:#F0F0F0;font-size:20px;font-weight:800;margin:0">${stats.reactions}</p>
          <p style="color:#71717A;font-size:11px;margin:4px 0 0 0">Reactions</p>
        </td>
        <td style="width:8px"></td>
        <td style="background:#1C1C1C;border:1px solid #282828;border-radius:8px;padding:16px;text-align:center;width:25%">
          <p style="color:#F0F0F0;font-size:20px;font-weight:800;margin:0">+${stats.followers}</p>
          <p style="color:#71717A;font-size:11px;margin:4px 0 0 0">Followers</p>
        </td>
        <td style="width:8px"></td>
        <td style="background:#1C1C1C;border:1px solid #282828;border-radius:8px;padding:16px;text-align:center;width:25%">
          <p style="color:#F0F0F0;font-size:20px;font-weight:800;margin:0">${stats.replies}</p>
          <p style="color:#71717A;font-size:11px;margin:4px 0 0 0">Replies</p>
        </td>
        <td style="width:8px"></td>
        <td style="background:#1C1C1C;border:1px solid #282828;border-radius:8px;padding:16px;text-align:center;width:25%">
          <p style="color:#22C55E;font-size:20px;font-weight:800;margin:0">+$${stats.angbaoEarned.toFixed(0)}</p>
          <p style="color:#71717A;font-size:11px;margin:4px 0 0 0">AngBao</p>
        </td>
      </tr>
    </table>
  `;

  const topPostsHtml = topPosts.length ? `
    <h2 style="color:#F0F0F0;font-size:14px;font-weight:700;margin:24px 0 12px 0;text-transform:uppercase;letter-spacing:0.05em">
      Top posts this week
    </h2>
    ${topPosts.map(p => `
      <a href="https://www.huat.co/post/${p.postId}" style="display:block;background:#1C1C1C;border:1px solid #282828;border-radius:8px;padding:12px 16px;margin:0 0 8px 0;text-decoration:none">
        <p style="color:#9CA3AF;font-size:12px;margin:0 0 4px 0"><strong style="color:#F0F0F0">${p.author}</strong></p>
        <p style="color:#9CA3AF;font-size:13px;margin:0;line-height:1.4">${p.content.slice(0, 120)}${p.content.length > 120 ? "…" : ""}</p>
      </a>
    `).join("")}
  ` : "";

  const trendingHtml = trendingStocks.length ? `
    <h2 style="color:#F0F0F0;font-size:14px;font-weight:700;margin:24px 0 12px 0;text-transform:uppercase;letter-spacing:0.05em">
      Trending stocks
    </h2>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${trendingStocks.map((s, i) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #1C1C1C">
            <span style="color:#555555;font-size:11px;font-weight:700;margin-right:8px">${i + 1}</span>
            <strong style="color:#F0F0F0;font-size:13px">${s.name}</strong>
            <span style="color:#555555;font-size:11px;margin-left:6px">${s.ticker}</span>
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #1C1C1C;text-align:right">
            <span style="color:#555555;font-size:11px">${s.postCount} posts</span>
          </td>
        </tr>
      `).join("")}
    </table>
  ` : "";

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Your week on Huat",
    html: huatEmail({
      preheader: `${stats.reactions} reactions, +${stats.followers} followers this week`,
      heading: "Your week on Huat",
      body: `
        <p style="color:#9CA3AF;margin:0 0 20px 0">Here's what happened on the platform this week.</p>
        ${statsHtml}
        ${topPostsHtml}
        ${trendingHtml}
      `,
      ctaText: "Open Huat",
      ctaUrl: "https://www.huat.co/feed",
    }),
  });
}

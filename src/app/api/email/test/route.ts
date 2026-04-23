import { NextResponse } from "next/server";
import { resend, FROM_EMAIL } from "@/lib/email/client";
import { huatEmail } from "@/lib/email/template";

const TEST_EMAIL = "rk@smartkarma.com";

export async function POST() {
  const results: { type: string; success: boolean; error?: string }[] = [];

  // 1. New Message
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: TEST_EMAIL,
      subject: "Ahmad Saefudin sent you a message on Huat",
      html: huatEmail({
        preheader: "Have you seen the latest DBS results?",
        heading: "New message from Ahmad Saefudin",
        body: `
          <p style="color:#F0F0F0;background:#1C1C1C;border:1px solid #282828;border-radius:8px;padding:12px 16px;font-size:14px;margin:0 0 16px 0">
            "Have you seen the latest DBS results? Their non-interest income is looking really strong this quarter."
          </p>
        `,
        ctaText: "Reply on Huat",
        ctaUrl: "https://www.huat.co/messages",
      }),
    });
    results.push({ type: "new_message", success: true });
  } catch (e) { results.push({ type: "new_message", success: false, error: String(e) }); }

  // 2. New Follower
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: TEST_EMAIL,
      subject: "Michael Fritzell is now following you on Huat",
      html: huatEmail({
        preheader: "Michael Fritzell (@michael.fritzell) started following you",
        heading: "Michael Fritzell followed you",
        body: `
          <p style="color:#9CA3AF">
            <strong style="color:#F0F0F0">Michael Fritzell</strong>
            <span style="color:#555555;margin-left:6px">@michael.fritzell</span>
          </p>
          <p style="color:#9CA3AF;margin-top:8px">They'll see your posts in their feed. Check out their profile and follow back if you'd like.</p>
        `,
        ctaText: "View Michael's profile",
        ctaUrl: "https://www.huat.co/profile/michael.fritzell",
      }),
    });
    results.push({ type: "new_follower", success: true });
  } catch (e) { results.push({ type: "new_follower", success: false, error: String(e) }); }

  // 3. Connection Request
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: TEST_EMAIL,
      subject: "Brendan Khow wants to connect on Huat",
      html: huatEmail({
        preheader: "Accept to start messaging with Brendan Khow",
        heading: "Connection request from Brendan Khow",
        body: `
          <p style="color:#9CA3AF">
            <strong style="color:#F0F0F0">Brendan Khow</strong>
            <span style="color:#555555;margin-left:6px">@brendankhow</span>
          </p>
          <p style="color:#9CA3AF;margin-top:8px">Accept their request to start messaging and share insights together.</p>
        `,
        ctaText: "View request",
        ctaUrl: "https://www.huat.co/notifications",
      }),
    });
    results.push({ type: "connect_request", success: true });
  } catch (e) { results.push({ type: "connect_request", success: false, error: String(e) }); }

  // 4. Connection Accepted
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: TEST_EMAIL,
      subject: "Pragyat Karna accepted your connection on Huat",
      html: huatEmail({
        preheader: "You can now message Pragyat Karna",
        heading: "You're connected with Pragyat Karna",
        body: `
          <p style="color:#9CA3AF">
            <strong style="color:#F0F0F0">Pragyat Karna</strong> accepted your connection request.
            You can now message each other directly.
          </p>
        `,
        ctaText: "Message Pragyat",
        ctaUrl: "https://www.huat.co/messages",
      }),
    });
    results.push({ type: "connect_accepted", success: true });
  } catch (e) { results.push({ type: "connect_accepted", success: false, error: String(e) }); }

  // 5. Post Reply
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: TEST_EMAIL,
      subject: "Ahmad Saefudin replied to your post on Huat",
      html: huatEmail({
        preheader: "Interesting take — I think Singtel's 5G rollout is the real catalyst here",
        heading: "Ahmad Saefudin replied to your post",
        body: `
          <p style="color:#F0F0F0;background:#1C1C1C;border:1px solid #282828;border-radius:8px;padding:12px 16px;font-size:14px;margin:0 0 16px 0">
            "Interesting take — I think Singtel's 5G rollout is the real catalyst here. The enterprise segment could surprise on the upside."
          </p>
        `,
        ctaText: "View conversation",
        ctaUrl: "https://www.huat.co/post/example-post-id",
      }),
    });
    results.push({ type: "post_reply", success: true });
  } catch (e) { results.push({ type: "post_reply", success: false, error: String(e) }); }

  // 6. AngBao Milestone
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: TEST_EMAIL,
      subject: "You've reached 250 AngBao on Huat",
      html: huatEmail({
        preheader: "Your social currency on Huat just hit a milestone",
        heading: "250 AngBao reached",
        body: `
          <p style="text-align:center;margin:0 0 20px 0">
            <span style="font-size:48px">🧧</span>
          </p>
          <p style="color:#22C55E;font-size:32px;font-weight:900;text-align:center;margin:0 0 8px 0">
            $250
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
    results.push({ type: "angbao_milestone", success: true });
  } catch (e) { results.push({ type: "angbao_milestone", success: false, error: String(e) }); }

  // 7. Weekly Digest
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: TEST_EMAIL,
      subject: "Your week on Huat",
      html: huatEmail({
        preheader: "12 reactions, +3 followers this week",
        heading: "Your week on Huat",
        body: `
          <p style="color:#9CA3AF;margin:0 0 20px 0">Here's what happened on the platform this week.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0">
            <tr>
              <td style="background:#1C1C1C;border:1px solid #282828;border-radius:8px;padding:16px;text-align:center;width:25%">
                <p style="color:#F0F0F0;font-size:20px;font-weight:800;margin:0">12</p>
                <p style="color:#71717A;font-size:11px;margin:4px 0 0 0">Reactions</p>
              </td>
              <td style="width:8px"></td>
              <td style="background:#1C1C1C;border:1px solid #282828;border-radius:8px;padding:16px;text-align:center;width:25%">
                <p style="color:#F0F0F0;font-size:20px;font-weight:800;margin:0">+3</p>
                <p style="color:#71717A;font-size:11px;margin:4px 0 0 0">Followers</p>
              </td>
              <td style="width:8px"></td>
              <td style="background:#1C1C1C;border:1px solid #282828;border-radius:8px;padding:16px;text-align:center;width:25%">
                <p style="color:#F0F0F0;font-size:20px;font-weight:800;margin:0">5</p>
                <p style="color:#71717A;font-size:11px;margin:4px 0 0 0">Replies</p>
              </td>
              <td style="width:8px"></td>
              <td style="background:#1C1C1C;border:1px solid #282828;border-radius:8px;padding:16px;text-align:center;width:25%">
                <p style="color:#22C55E;font-size:20px;font-weight:800;margin:0">+$18</p>
                <p style="color:#71717A;font-size:11px;margin:4px 0 0 0">AngBao</p>
              </td>
            </tr>
          </table>

          <h2 style="color:#F0F0F0;font-size:14px;font-weight:700;margin:24px 0 12px 0;text-transform:uppercase;letter-spacing:0.05em">
            Top posts this week
          </h2>
          <a href="https://www.huat.co/post/example1" style="display:block;background:#1C1C1C;border:1px solid #282828;border-radius:8px;padding:12px 16px;margin:0 0 8px 0;text-decoration:none">
            <p style="color:#9CA3AF;font-size:12px;margin:0 0 4px 0"><strong style="color:#F0F0F0">Raghav Kapoor</strong></p>
            <p style="color:#9CA3AF;font-size:13px;margin:0;line-height:1.4">Major positive for DFI if this goes through. The Jardine restructuring could unlock significant value for shareholders.</p>
          </a>
          <a href="https://www.huat.co/post/example2" style="display:block;background:#1C1C1C;border:1px solid #282828;border-radius:8px;padding:12px 16px;margin:0 0 8px 0;text-decoration:none">
            <p style="color:#9CA3AF;font-size:12px;margin:0 0 4px 0"><strong style="color:#F0F0F0">Ahmad Saefudin</strong></p>
            <p style="color:#9CA3AF;font-size:13px;margin:0;line-height:1.4">ST Engineering looking solid after the latest defense contract win. Order book at all-time high.</p>
          </a>

          <h2 style="color:#F0F0F0;font-size:14px;font-weight:700;margin:24px 0 12px 0;text-transform:uppercase;letter-spacing:0.05em">
            Trending stocks
          </h2>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #1C1C1C">
                <span style="color:#555555;font-size:11px;font-weight:700;margin-right:8px">1</span>
                <strong style="color:#F0F0F0;font-size:13px">DFI Retail Group</strong>
                <span style="color:#555555;font-size:11px;margin-left:6px">DFI SP</span>
              </td>
              <td style="padding:8px 0;border-bottom:1px solid #1C1C1C;text-align:right">
                <span style="color:#555555;font-size:11px">8 posts</span>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #1C1C1C">
                <span style="color:#555555;font-size:11px;font-weight:700;margin-right:8px">2</span>
                <strong style="color:#F0F0F0;font-size:13px">Singtel</strong>
                <span style="color:#555555;font-size:11px;margin-left:6px">ST SP</span>
              </td>
              <td style="padding:8px 0;border-bottom:1px solid #1C1C1C;text-align:right">
                <span style="color:#555555;font-size:11px">5 posts</span>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #1C1C1C">
                <span style="color:#555555;font-size:11px;font-weight:700;margin-right:8px">3</span>
                <strong style="color:#F0F0F0;font-size:13px">ST Engineering</strong>
                <span style="color:#555555;font-size:11px;margin-left:6px">STE SP</span>
              </td>
              <td style="padding:8px 0;border-bottom:1px solid #1C1C1C;text-align:right">
                <span style="color:#555555;font-size:11px">4 posts</span>
              </td>
            </tr>
          </table>
        `,
        ctaText: "Open Huat",
        ctaUrl: "https://www.huat.co/feed",
      }),
    });
    results.push({ type: "weekly_digest", success: true });
  } catch (e) { results.push({ type: "weekly_digest", success: false, error: String(e) }); }

  return NextResponse.json({ results });
}

// On-brand Huat email template — dark theme, red accents
// Returns raw HTML string (Resend accepts HTML)

interface EmailTemplateOptions {
  preheader?: string;
  heading: string;
  body: string; // HTML content
  ctaText?: string;
  ctaUrl?: string;
  footerExtra?: string;
}

export function huatEmail({ preheader, heading, body, ctaText, ctaUrl, footerExtra }: EmailTemplateOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${heading}</title>
  ${preheader ? `<span style="display:none;max-height:0;overflow:hidden;mso-hide:all">${preheader}</span>` : ""}
</head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A">
    <tr>
      <td align="center" style="padding:40px 20px">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px">
              <span style="color:#E8311A;font-weight:900;font-size:28px;letter-spacing:-1px">Huat</span>
              <span style="color:#E8311A;font-weight:900;font-size:28px;margin-left:6px">发</span>
            </td>
          </tr>

          <!-- Content card -->
          <tr>
            <td style="background:#141414;border:1px solid #282828;border-radius:12px;padding:32px">

              <!-- Heading -->
              <h1 style="color:#F0F0F0;font-size:22px;font-weight:800;margin:0 0 16px 0;line-height:1.3">
                ${heading}
              </h1>

              <!-- Body -->
              <div style="color:#9CA3AF;font-size:15px;line-height:1.6;margin:0 0 24px 0">
                ${body}
              </div>

              ${ctaText && ctaUrl ? `
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 8px 0">
                <tr>
                  <td style="background:#E8311A;border-radius:8px;padding:12px 28px">
                    <a href="${ctaUrl}" style="color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;display:inline-block">
                      ${ctaText}
                    </a>
                  </td>
                </tr>
              </table>
              ` : ""}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center">
              ${footerExtra ? `<p style="color:#71717A;font-size:12px;margin:0 0 12px 0">${footerExtra}</p>` : ""}
              <p style="color:#555555;font-size:12px;margin:0 0 4px 0">
                Invest Together. Prosper Together.
              </p>
              <p style="color:#555555;font-size:11px;margin:0">
                <a href="https://www.huat.co/settings/notifications" style="color:#555555;text-decoration:underline">Manage email preferences</a>
                &nbsp;&middot;&nbsp;
                <a href="https://www.huat.co" style="color:#555555;text-decoration:underline">huat.co</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

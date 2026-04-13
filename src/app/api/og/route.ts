import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url || !/^https?:\/\//.test(url)) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Huat/1.0; +https://huat.co)",
        "Accept": "text/html",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return NextResponse.json({ error: "Fetch failed" }, { status: 422 });

    const html = await res.text();

    function getMeta(property: string): string | null {
      const m =
        html.match(new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i")) ||
        html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i")) ||
        html.match(new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, "i")) ||
        html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, "i"));
      return m ? m[1] : null;
    }

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);

    const og_title = getMeta("og:title") || titleMatch?.[1]?.trim() || null;
    const og_description = getMeta("og:description") || getMeta("description") || null;
    const og_image = getMeta("og:image") || null;
    const og_site_name = getMeta("og:site_name") || new URL(url).hostname.replace("www.", "") || null;

    return NextResponse.json(
      { og_title, og_description, og_image, og_site_name },
      { headers: { "Cache-Control": "public, s-maxage=3600" } }
    );
  } catch {
    return NextResponse.json({ error: "Failed to fetch OG data" }, { status: 422 });
  }
}

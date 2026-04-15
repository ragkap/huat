import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  const publicPaths = ["/", "/login", "/auth/callback"];
  const isPublic =
    publicPaths.some(p => pathname === p || pathname.startsWith("/auth/")) ||
    pathname === "/opengraph-image" ||
    pathname.endsWith("/opengraph-image") ||
    /^\/stocks\/[^/]+(\/opengraph-image)?$/.test(pathname) ||
    pathname.startsWith("/api/stocks/") ||
    /^\/post\/[^/]+$/.test(pathname);

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  // Check onboarding completion for authenticated users
  if (user && !isPublic && pathname !== "/onboarding") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("country, username")
      .eq("id", user.id)
      .single();

    if (!profile?.country || !profile?.username) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

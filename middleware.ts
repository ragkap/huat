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

  // Use getUser() for auth verification (contacts Supabase Auth server)
  const { data: { user } } = await supabase.auth.getUser();
  // Also check session from cookies (faster, for redirect decisions)
  const { data: { session } } = await supabase.auth.getSession();
  const isAuthenticated = !!user || !!session;
  const { pathname } = request.nextUrl;

  const publicPaths = ["/", "/login", "/auth/callback"];
  const isPublic =
    publicPaths.some(p => pathname === p || pathname.startsWith("/auth/")) ||
    pathname === "/opengraph-image" ||
    pathname.endsWith("/opengraph-image") ||
    /^\/stocks\/[^/]+(\/opengraph-image)?$/.test(pathname) ||
    pathname.startsWith("/api/stocks/") ||
    /^\/post\/[^/]+$/.test(pathname);

  if (!isAuthenticated && !isPublic) {
    const loginRedirect = NextResponse.redirect(new URL("/login", request.url));
    supabaseResponse.cookies.getAll().forEach(c => loginRedirect.cookies.set(c.name, c.value));
    return loginRedirect;
  }

  if (isAuthenticated && pathname === "/login") {
    const redirect = request.nextUrl.searchParams.get("redirect") ?? "/feed";
    const redirectResponse = NextResponse.redirect(new URL(redirect, request.url));
    // Carry over any cookie changes from the Supabase auth refresh
    supabaseResponse.cookies.getAll().forEach(c => redirectResponse.cookies.set(c.name, c.value));
    return redirectResponse;
  }

  // Check onboarding completion for authenticated users
  if (isAuthenticated && !isPublic && pathname !== "/onboarding") {
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

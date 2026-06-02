import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes the session if expired — must be called before any other logic.
  const { data: { user } } = await supabase.auth.getUser();

  // Write a non-httpOnly hint cookie so the Navbar can read auth state synchronously
  // from document.cookie before the first paint, eliminating the logged-out flash.
  if (user) {
    // Enforce bans on every request — a user banned mid-session is signed out
    // and bounced to /login. Skip on /login itself to avoid a redirect loop.
    if (request.nextUrl.pathname !== "/login") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_banned")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.is_banned) {
        await supabase.auth.signOut();
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.search = "";
        url.searchParams.set("error", "banned");
        const redirect = NextResponse.redirect(url);
        // Carry over the cleared auth cookies and drop the session hint
        supabaseResponse.cookies.getAll().forEach((c) => redirect.cookies.set(c));
        redirect.cookies.delete("sb-session-hint");
        return redirect;
      }
    }

    const hint = encodeURIComponent(JSON.stringify({
      username: user.user_metadata?.username ?? null,
      role:     user.user_metadata?.role     ?? null,
    }));
    supabaseResponse.cookies.set("sb-session-hint", hint, {
      path:     "/",
      sameSite: "lax",
      httpOnly: false,          // must be JS-readable
      maxAge:   60 * 60 * 24 * 7, // 1 week — refreshed on every request
    });
  } else {
    // Clear the hint so back-navigation to a cached page shows logged-out correctly.
    supabaseResponse.cookies.delete("sb-session-hint");
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

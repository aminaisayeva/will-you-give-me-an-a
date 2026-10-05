import { NextResponse, type NextRequest } from "next/server";
import { hasFullName } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";
import { UNLOCK_COOKIE, unlockCookieOptions } from "@/lib/lock";

// Google redirects here (via Supabase) with a one-time code after sign-in.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error_description") ?? searchParams.get("error");

  // Behind Vercel's load balancer, origin is internal; prefer the public host.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const base =
    process.env.NODE_ENV !== "development" && forwardedHost
      ? `https://${forwardedHost}`
      : origin;

  const fail = (message: string) =>
    NextResponse.redirect(`${base}/login?error=${encodeURIComponent(message)}`);

  if (oauthError) return fail(oauthError);
  if (!code) return fail("Missing sign-in code. Please try again.");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    // The PKCE verifier cookie lives on the site where sign-in started; it's
    // missing if Google sent us back to a different address.
    return fail(
      error?.message.includes("code verifier")
        ? "Sign-in started on a different address of this site. Please try again here."
        : (error?.message ?? "Could not sign you in."),
    );
  }

  // First sign-in (or names never filled in): send them to the setup assistant.
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", data.user.id)
    .maybeSingle();

  const response = NextResponse.redirect(`${base}${hasFullName(profile) ? "/" : "/welcome"}`);
  response.cookies.set(UNLOCK_COOKIE, "1", unlockCookieOptions);
  return response;
}

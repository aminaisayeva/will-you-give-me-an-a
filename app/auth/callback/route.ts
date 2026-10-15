import { NextResponse, type NextRequest } from "next/server";
import { profileFromSignupMetadata } from "@/lib/cooked-session";
import { createClient } from "@/lib/supabase/server";
import { RETURN_TO_COOKIE, safeReturnPath } from "@/lib/return-to";

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

  // New here (no name or no @username yet)? Finish the profile first.
  await profileFromSignupMetadata(supabase, data.user);
  const [{ data: names }, { data: cooked }] = await Promise.all([
    supabase.from("profiles").select("first_name, last_name").eq("id", data.user.id).maybeSingle(),
    supabase.from("cooked_profiles").select("user_id").eq("user_id", data.user.id).maybeSingle(),
  ]);
  const returnTo = safeReturnPath(request.cookies.get(RETURN_TO_COOKIE)?.value);
  const done = Boolean(names?.first_name?.trim() && names?.last_name?.trim() && cooked);
  const response = NextResponse.redirect(`${base}${done ? (returnTo ?? "/feed") : "/onboarding"}`);
  if (done) response.cookies.delete(RETURN_TO_COOKIE);
  return response;
}

import type { NextRequest } from "next/server";
import { isSlug } from "@/lib/sites";
import { getSupabase } from "@/lib/supabase";

// Serves a generated site's HTML. The page is written by an AI from a user's
// prompt, so it runs fully sandboxed: an opaque origin (no access to this
// app's cookies or storage), inline scripts only, and no network access.
const SANDBOX_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Content-Security-Policy": [
    "sandbox allow-scripts",
    "default-src 'none'",
    "script-src 'unsafe-inline'",
    "style-src 'unsafe-inline' https://fonts.googleapis.com",
    "font-src https://fonts.gstatic.com data:",
    "img-src data: blob: https://picsum.photos https://fastly.picsum.photos",
    "media-src data:",
    "connect-src 'none'",
    "form-action 'none'",
    "base-uri 'none'",
    "frame-ancestors 'self'",
  ].join("; "),
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Cache-Control": "public, max-age=300",
};

export async function GET(_request: NextRequest, ctx: RouteContext<"/s/[slug]">) {
  const { slug } = await ctx.params;
  const address = decodeURIComponent(slug).toLowerCase();
  if (!isSlug(address)) return new Response("Not found", { status: 404 });

  const { data } = await getSupabase().from("sites").select("html").eq("slug", address).maybeSingle();
  if (!data) {
    return new Response(
      `<!doctype html><title>Not found</title><body style="font-family:-apple-system,sans-serif;text-align:center;padding:15vh 1rem;color:#555"><h1>Safari can't find ${address}</h1><p>Nobody has built this site yet.</p></body>`,
      { status: 404, headers: { ...SANDBOX_HEADERS, "Cache-Control": "no-store" } },
    );
  }
  return new Response(data.html, { headers: SANDBOX_HEADERS });
}

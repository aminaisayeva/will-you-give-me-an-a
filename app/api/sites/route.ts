import { NextResponse, type NextRequest } from "next/server";
import { GeminiError, generateSite, SITE_SYSTEM_PROMPT } from "@/lib/gemini";
import { addressFromInput, DAILY_SITE_LIMIT, MAX_PROMPT, toSlug } from "@/lib/sites";
import { createClient } from "@/lib/supabase/server";

// Building a page with the model can take a while (and may fall back to a
// second model when the first is overloaded).
export const maxDuration = 300;

const json = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status });

// POST { input } -> { slug, created }. Opens the existing site when that
// address was already built; otherwise asks Gemini to build it and saves the
// result together with the prompt.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: "Sign in to build websites." }, 401);

  const body = await request.json().catch(() => null);
  const input = typeof body?.input === "string" ? body.input.trim() : "";
  if (!input) return json({ error: "Type an address or describe a site." }, 400);
  if (input.length > MAX_PROMPT) return json({ error: `Keep it under ${MAX_PROMPT} characters.` }, 400);

  // The shared internet: an address someone already built just opens.
  const address = addressFromInput(input);
  if (address) {
    const { data: existing } = await supabase.from("sites").select("slug").eq("slug", address).maybeSingle();
    if (existing) return json({ slug: existing.slug, created: false });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("sites")
    .select("id", { count: "exact", head: true })
    .eq("author_id", user.id)
    .gte("created_at", since);
  if ((count ?? 0) >= DAILY_SITE_LIMIT) {
    return json({ error: `You've built ${DAILY_SITE_LIMIT} sites today. Come back tomorrow!` }, 429);
  }

  const userPrompt = address
    ? `Build the website that lives at ${address}.`
    : `Build this website: ${input}`;

  let site;
  try {
    site = await generateSite(userPrompt);
  } catch (err) {
    const message = err instanceof GeminiError ? err.message : "Something went wrong building that site.";
    console.error("site generation failed", err);
    return json({ error: message }, 502);
  }

  // Find a free address: keep the one the user typed, otherwise the model's
  // suggestion, adding -2, -3... when it's taken.
  let slug = address ?? toSlug(site.address);
  for (let attempt = 0; attempt < 6; attempt++) {
    const { error } = await supabase.from("sites").insert({
      slug,
      title: site.title,
      description: site.description || null,
      prompt: input,
      system_prompt: SITE_SYSTEM_PROMPT,
      model: site.model,
      html: site.html,
    });
    if (!error) return json({ slug, created: true });
    if (error.code !== "23505") {
      console.error("saving site failed", error);
      return json({ error: `Could not save the site: ${error.message}` }, 500);
    }
    // Someone else just built this exact address: show theirs.
    if (address) return json({ slug: address, created: false });
    const [name, ...tld] = slug.split(".");
    slug = `${name.replace(/-\d+$/, "")}-${attempt + 2}.${tld.join(".")}`;
  }
  return json({ error: "Couldn't find a free address for that site. Try again." }, 500);
}

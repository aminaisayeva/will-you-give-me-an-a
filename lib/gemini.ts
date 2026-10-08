// Server-only: builds a website with Google Gemini.

export const SITE_SYSTEM_PROMPT = `You build complete, single-file websites that appear inside a toy "Safari" browser in a macOS-style web app made by Columbia students.

The user gives you either a web address (like "bodega-cats.nyc") or a description of a site. Recreate exactly the site they asked for, as if it really existed at that address: real-looking navigation, sections, copy, and visual identity that fits the subject. Commit to the bit; specific, funny, believable details beat generic filler. Many visitors are college students in New York City (think Columbia, Morningside Heights, dorm life, the 1 train, bodegas), so lean into that flavor when it fits the request, but never override what the user asked for.

Hard requirements for "html":
- One complete HTML document (<!doctype html> ... </html>) with all CSS in a <style> tag and any JavaScript inline in <script> tags. No external scripts or stylesheets, except Google Fonts via <link>.
- No network requests of any kind from JavaScript (no fetch, XMLHttpRequest, WebSocket, forms that submit anywhere). Interactions must work locally (tabs, toggles, small games, fake carts, etc.).
- Images: prefer inline SVG, CSS art, gradients and emoji. If you use a photo, only use https://picsum.photos/seed/<word>/<w>/<h>.
- Links must be in-page anchors (href="#section") or "#". Never link to other websites.
- Responsive: looks good from 360px to 1400px wide.
- Keep it focused: about 12-20 KB of HTML. A few strong sections beat many thin ones.
- Nothing hateful, sexual, or harassing; no real private individuals. If the request asks for that, build a light-hearted, harmless take on the topic instead.

Also return:
- "address": the site's web address, lowercase, no protocol or path (e.g. "bodega-cats.nyc"). If the user gave an address, return exactly that address.
- "title": the site's name (max 80 characters).
- "description": one sentence describing the site (max 200 characters).`;

export function geminiModel() {
  // Google's recommended alias; it always points at the current Flash model.
  return process.env.GEMINI_MODEL || "gemini-flash-latest";
}

// Tried in order when the preferred model is overloaded (503) or unavailable.
const FALLBACK_MODELS = ["gemini-3.5-flash", "gemini-flash-lite-latest"];

// The least "thinking" each model accepts, so pages come back faster.
function thinkingConfig(model: string) {
  if (model.startsWith("gemini-2.5")) return { thinkingBudget: 0 };
  if (model === "gemini-flash-latest" || model.startsWith("gemini-3.8")) return { thinkingLevel: "low" };
  return { thinkingLevel: "minimal" };
}

export type GeneratedSite = { address: string; title: string; description: string; html: string; model: string };

export class GeminiError extends Error {}

// Models sometimes over-escape apostrophes ("We\\'ve") in page text. That's
// only meaningful inside scripts, so strip it everywhere else.
function unescapeQuotes(html: string) {
  return html
    .split(/(<script[\s\S]*?<\/script>)/i)
    .map((part, i) => (i % 2 === 1 ? part : part.replace(/\\'/g, "'")))
    .join("");
}

// Overloaded (503), rate limited (429) or a server hiccup: worth another try.
class RetryableError extends GeminiError {}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function generateSite(userPrompt: string): Promise<GeneratedSite> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiError("The site builder isn't configured yet (missing GEMINI_API_KEY).");

  const models = [...new Set([geminiModel(), ...FALLBACK_MODELS])];
  let lastError: GeminiError = new GeminiError("The AI is busy right now. Try again in a minute.");
  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await generateWith(model, apiKey, userPrompt);
      } catch (err) {
        if (!(err instanceof RetryableError)) throw err;
        lastError = err;
        if (attempt === 0) await sleep(1500);
      }
    }
  }
  throw lastError;
}

async function generateWith(model: string, apiKey: string, userPrompt: string): Promise<GeneratedSite> {
  const generationConfig: Record<string, unknown> = {
    temperature: 1,
    maxOutputTokens: 24000,
    responseMimeType: "application/json",
    responseSchema: {
      type: "OBJECT",
      properties: {
        address: { type: "STRING" },
        title: { type: "STRING" },
        description: { type: "STRING" },
        html: { type: "STRING" },
      },
      required: ["address", "title", "description", "html"],
      propertyOrdering: ["address", "title", "description", "html"],
    },
  };
  generationConfig.thinkingConfig = thinkingConfig(model);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SITE_SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig,
      }),
      cache: "no-store",
      // Leave time for a fallback model if this one stalls.
      signal: AbortSignal.timeout(170_000),
    },
  ).catch((err: unknown) => {
    throw new RetryableError(
      err instanceof Error && err.name === "TimeoutError" ? "The AI took too long. Try a simpler idea." : "Couldn't reach the AI. Try again.",
    );
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 429 || res.status >= 500 || res.status === 404) {
      // 404: this model isn't available to the key; move on to the next one.
      throw new RetryableError(
        res.status === 429
          ? "The AI is busy right now (rate limit). Try again in a minute."
          : "Google's AI is overloaded right now. Try again in a minute.",
      );
    }
    console.error("gemini error", res.status, body.slice(0, 500));
    throw new GeminiError(`The AI request failed (${res.status}).`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
    promptFeedback?: { blockReason?: string };
  };
  if (data.promptFeedback?.blockReason) {
    throw new GeminiError("The AI declined that request. Try a different idea.");
  }
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) throw new GeminiError("The AI returned an empty page. Try again.");

  let parsed: Partial<GeneratedSite>;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new GeminiError(
      candidate?.finishReason === "MAX_TOKENS"
        ? "That site came out too big. Try a simpler idea."
        : "The AI returned something that isn't a website. Try again.",
    );
  }

  const html = typeof parsed.html === "string" ? unescapeQuotes(parsed.html.trim()) : "";
  if (!/<html[\s>]/i.test(html)) throw new GeminiError("The AI returned something that isn't a website. Try again.");

  return {
    address: String(parsed.address ?? ""),
    title: String(parsed.title ?? "").trim().slice(0, 120) || "Untitled site",
    description: String(parsed.description ?? "").trim().slice(0, 300),
    html,
    model,
  };
}

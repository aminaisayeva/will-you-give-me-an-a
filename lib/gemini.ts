// Server-only: Google Gemini calls for the website builder and cooked.ai.

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

// The user message sent with each request. Kept here so the app can show
// people exactly what was sent (the "Prompt" buttons).
export function siteUserMessage(input: string, address: string | null) {
  return address ? `Build the website that lives at ${address}.` : `Build this website: ${input}`;
}

export function captionUserMessage(context: string | null) {
  return context ? `Uploader's context: "${context}"` : "No context from the uploader.";
}

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

type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

type JsonCall = {
  systemPrompt: string;
  parts: Part[];
  schema: Record<string, unknown>;
  maxOutputTokens: number;
  timeoutMs: number;
  temperature?: number;
};

// Ask Gemini for JSON matching `schema`. Retries overloaded models, then falls
// back to the next model. Returns the parsed object and the model that answered.
async function callJson<T>(call: JsonCall): Promise<{ data: Partial<T>; model: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiError("The AI isn't configured yet (missing GEMINI_API_KEY).");

  const models = [...new Set([geminiModel(), ...FALLBACK_MODELS])];
  let lastError: GeminiError = new GeminiError("The AI is busy right now. Try again in a minute.");
  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return { data: await callModel<T>(model, apiKey, call), model };
      } catch (err) {
        if (!(err instanceof RetryableError)) throw err;
        lastError = err;
        if (attempt === 0) await sleep(1500);
      }
    }
  }
  throw lastError;
}

async function callModel<T>(model: string, apiKey: string, call: JsonCall): Promise<Partial<T>> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: call.systemPrompt }] },
        contents: [{ role: "user", parts: call.parts }],
        generationConfig: {
          temperature: call.temperature ?? 1,
          maxOutputTokens: call.maxOutputTokens,
          responseMimeType: "application/json",
          responseSchema: call.schema,
          thinkingConfig: thinkingConfig(model),
        },
      }),
      cache: "no-store",
      // Leave time for a fallback model if this one stalls.
      signal: AbortSignal.timeout(call.timeoutMs),
    },
  ).catch((err: unknown) => {
    throw new RetryableError(
      err instanceof Error && err.name === "TimeoutError" ? "The AI took too long. Try again." : "Couldn't reach the AI. Try again.",
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
  if (data.promptFeedback?.blockReason || data.candidates?.[0]?.finishReason === "SAFETY") {
    throw new GeminiError("The AI declined that one. Try something else.");
  }
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) throw new GeminiError("The AI returned nothing. Try again.");
  try {
    return JSON.parse(text) as Partial<T>;
  } catch {
    throw new GeminiError(
      candidate?.finishReason === "MAX_TOKENS" ? "The answer came out too long. Try something simpler." : "The AI returned something unexpected. Try again.",
    );
  }
}

// --- websitemaker.com -------------------------------------------------------

export async function generateSite(userPrompt: string): Promise<GeneratedSite> {
  const { data, model } = await callJson<Omit<GeneratedSite, "model">>({
    systemPrompt: SITE_SYSTEM_PROMPT,
    parts: [{ text: userPrompt }],
    maxOutputTokens: 24000,
    timeoutMs: 170_000,
    schema: {
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
  });

  const html = typeof data.html === "string" ? unescapeQuotes(data.html.trim()) : "";
  if (!/<html[\s>]/i.test(html)) throw new GeminiError("The AI returned something that isn't a website. Try again.");

  return {
    address: String(data.address ?? ""),
    title: String(data.title ?? "").trim().slice(0, 120) || "Untitled site",
    description: String(data.description ?? "").trim().slice(0, 300),
    html,
    model,
  };
}

// --- cooked.ai --------------------------------------------------------------

// The voices every photo gets captioned in, in display order. Picked for the
// course persona: a chronically online Columbia junior from the Midwest.
export const CAPTION_STYLES = [
  { style: "Chronically Online", emoji: "\u{1F480}", brief: "Gen Z internet brain: lowercase, terminally online slang, reaction-meme energy." },
  { style: "Midwest Mom", emoji: "\u{1F33D}", brief: "Supportive, slightly worried Midwestern mom texting about the photo. Casserole energy." },
  { style: "Real New Yorker", emoji: "\u{1F5FD}", brief: "Blunt, unimpressed native New Yorker who has seen it all. Short and dry." },
  { style: "Columbia Tour Guide", emoji: "\u{1F981}", brief: "Over-enthusiastic campus tour guide walking backwards, making everything sound prestigious." },
] as const;

export const CAPTION_SYSTEM_PROMPT = `You write captions for cooked.ai, where college students upload a photo and the internet votes on which caption "cooked" hardest.

Look closely at the photo and write exactly one caption for each voice below. Each caption must be specific to what is actually in the photo (objects, setting, lighting, vibe), short (under 140 characters), and funny enough that someone would screenshot it. Different jokes per voice, no repeats.

Voices:
${CAPTION_STYLES.map((c) => `- "${c.style}": ${c.brief}`).join("\n")}

Rules:
- Roast the situation, never people's bodies, race, gender, or other protected traits. Playful, not cruel. PG-13.
- If the uploader added context, use it.
- No hashtags. Emoji are fine but not required.
- Return captions in the order the voices are listed, with "style" set to the voice name exactly.`;

export type GeneratedCaption = { style: string; text: string };

export async function captionPhoto(
  image: { mimeType: string; base64: string },
  context: string | null,
): Promise<{ captions: GeneratedCaption[]; model: string }> {
  const { data, model } = await callJson<{ captions: GeneratedCaption[] }>({
    systemPrompt: CAPTION_SYSTEM_PROMPT,
    parts: [
      { inlineData: { mimeType: image.mimeType, data: image.base64 } },
      { text: captionUserMessage(context) },
    ],
    maxOutputTokens: 2000,
    timeoutMs: 60_000,
    schema: {
      type: "OBJECT",
      properties: {
        captions: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: { style: { type: "STRING" }, text: { type: "STRING" } },
            required: ["style", "text"],
            propertyOrdering: ["style", "text"],
          },
        },
      },
      required: ["captions"],
    },
  });

  // Keep only the voices we asked for, one each, in our order.
  const byStyle = new Map(
    (Array.isArray(data.captions) ? data.captions : [])
      .filter((c) => c && typeof c.text === "string" && c.text.trim())
      .map((c) => [String(c.style).toLowerCase().trim(), c.text.trim().replace(/^["“]|["”]$/g, "").slice(0, 280)]),
  );
  const captions = CAPTION_STYLES.flatMap(({ style }) => {
    const text = byStyle.get(style.toLowerCase());
    return text ? [{ style, text }] : [];
  });
  if (captions.length < 2) throw new GeminiError("The AI couldn't caption that photo. Try another one.");
  return { captions, model };
}

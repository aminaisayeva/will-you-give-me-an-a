// Shared helpers for the AI-generated websites shown in Safari.

export type SiteSummary = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  prompt: string;
  author_id: string;
  author_name: string | null;
  upvotes: number;
  downvotes: number;
  score: number;
  created_at: string;
};

export const SITE_SUMMARY_COLUMNS =
  "id, slug, title, description, prompt, author_id, author_name, upvotes, downvotes, score, created_at";

export const MAX_PROMPT = 500;
export const DAILY_SITE_LIMIT = 20;

const SLUG_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

// "https://www.Bodega-Cats.nyc/menu" -> "bodega-cats.nyc". Returns null when
// the input isn't shaped like a web address (e.g. a sentence describing a site).
export function addressFromInput(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed || /\s/.test(trimmed)) return null;
  const host = trimmed
    .replace(/^[a-z]+:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[/?#].*$/, "")
    .replace(/:\d+$/, "");
  return isSlug(host) ? host : null;
}

export function isSlug(value: string) {
  return value.length <= 80 && SLUG_RE.test(value);
}

// Turn whatever the model suggested into a valid address.
export function toSlug(value: string): string {
  const cleaned = value
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[/?#].*$/, "")
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/\.+/g, ".")
    .replace(/(^[.-]+)|([.-]+$)/g, "")
    .split(".")
    .map((part) => part.replace(/(^-+)|(-+$)/g, ""))
    .filter(Boolean)
    .join(".")
    .slice(0, 70);
  if (isSlug(cleaned)) return cleaned;
  const base = cleaned.replace(/\./g, "-").replace(/(^-+)|(-+$)/g, "") || "my-site";
  return `${base.slice(0, 60)}.com`;
}

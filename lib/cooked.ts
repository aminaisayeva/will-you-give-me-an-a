// Shared types and helpers for cooked.ai (safe to import in client code).
import { supabaseEnv } from "@/lib/supabase/env";

export const PHOTO_BUCKET = "photos";
export const MAX_CONTEXT = 140;
export const DAILY_PHOTO_LIMIT = 15;

export type Caption = {
  id: string;
  photo_id: string;
  style: string;
  text: string;
  position: number;
  upvotes: number;
  downvotes: number;
  score: number;
};

// A cooked.ai profile: public, separate from the Mac account's name.
export type CookedProfile = {
  user_id: string;
  username: string;
  display_name: string;
  avatar_path: string | null;
};

export function normaliseUsername(raw: string) {
  return raw.trim().replace(/^@/, "").toLowerCase();
}

const RESERVED = new Set(["admin", "cooked", "cookedai", "support", "root", "help", "moderator", "official", "staff"]);

// Returns what's wrong with a username, or null if it's fine.
export function usernameProblem(username: string): string | null {
  if (username.length < 3) return "Usernames need at least 3 characters.";
  if (username.length > 20) return "Usernames can be at most 20 characters.";
  if (!/^[a-z0-9_]+$/.test(username)) return "Use only lowercase letters, numbers and _.";
  if (RESERVED.has(username)) return `@${username} is reserved.`;
  return null;
}

export type PhotoPost = {
  id: string;
  author_id: string;
  author_name: string | null;
  image_path: string;
  prompt: string | null;
  model: string;
  score: number;
  created_at: string;
  captions: Caption[];
  author?: Pick<CookedProfile, "username" | "display_name" | "avatar_path"> | null;
};

export const PHOTO_COLUMNS =
  "id, author_id, author_name, image_path, prompt, model, score, created_at, captions(id, photo_id, style, text, position, upvotes, downvotes, score)";

export const STYLE_EMOJI: Record<string, string> = {
  "Chronically Online": "\u{1F480}",
  "Midwest Mom": "\u{1F33D}",
  "Real New Yorker": "\u{1F5FD}",
  "Columbia Tour Guide": "\u{1F981}",
};

export function photoUrl(path: string) {
  const { url } = supabaseEnv();
  return `${url}/storage/v1/object/public/${PHOTO_BUCKET}/${path}`;
}

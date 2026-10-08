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

import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";

export type Email = {
  id: string;
  folder: "inbox" | "sent";
  sender_name: string;
  sender_email: string;
  recipient_email: string;
  subject: string;
  body: string;
  sender_id: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_path: string | null;
  created_at: string;
  updated_at: string;
};

export const AVATAR_BUCKET = "avatars";
// Vercel functions accept request bodies up to 4.5 MB.
export const MAX_AVATAR_BYTES = 4 * 1024 * 1024;

// A stateless client with no user session, for public reads.
export function getSupabase() {
  const { url, anonKey } = supabaseEnv();
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

export function avatarUrl(path: string | null) {
  if (!path) return null;
  const { url } = supabaseEnv();
  return `${url}/storage/v1/object/public/${AVATAR_BUCKET}/${path}`;
}

export function hasFullName(profile: Pick<Profile, "first_name" | "last_name"> | null) {
  return Boolean(profile?.first_name?.trim() && profile?.last_name?.trim());
}

export function displayName(profile: Profile | null, fallback = "Guest") {
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");
  return name || profile?.email || fallback;
}

import { createClient } from "@supabase/supabase-js";

export type Email = {
  id: string;
  folder: "inbox" | "sent";
  sender_name: string;
  sender_email: string;
  recipient_email: string;
  subject: string;
  body: string;
  created_at: string;
};

// Credentials come from environment variables (.env.local locally, Vercel
// project settings in production). Nothing is hardcoded here.
export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

import type { Metadata } from "next";
import { connection } from "next/server";
import { getSupabase, type Email } from "@/lib/supabase";
import MailApp from "./MailApp";

export const metadata: Metadata = {
  title: "Mail · Will you give me an A?",
  description: "A macOS-style Mail app backed by a Supabase table.",
};

export default async function MailPage() {
  // Render per request so new rows show up without a redeploy.
  await connection();

  let emails: Email[] = [];
  let loadError: string | null = null;

  try {
    const { data, error } = await getSupabase()
      .from("emails")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) loadError = error.message;
    else emails = data ?? [];
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error";
  }

  return <MailApp emails={emails} loadError={loadError} />;
}

"use server";

import type { Email } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";

export type SendState = { ok: boolean; error: string | null; sentAt: number };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function sendEmail(
  _prev: SendState,
  formData: FormData,
): Promise<SendState> {
  const senderName = field(formData, "sender_name");
  const senderEmail = field(formData, "sender_email");
  const recipient = field(formData, "recipient_email");
  const subject = field(formData, "subject");
  const body = field(formData, "body");

  const fail = (error: string): SendState => ({ ok: false, error, sentAt: 0 });

  if (!senderName || senderName.length > 80) return fail("Please enter your name (max 80 characters).");
  if (!EMAIL_RE.test(senderEmail) || senderEmail.length > 254) return fail("Your email address looks invalid.");
  if (!EMAIL_RE.test(recipient) || recipient.length > 254) return fail("The recipient address looks invalid.");
  if (!subject || subject.length > 200) return fail("Subject is required (max 200 characters).");
  if (!body || body.length > 5000) return fail("Message is required (max 5000 characters).");

  // Row level security only lets signed-in users insert into "sent"; the
  // database stamps sender_id with their id.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Sign in to send mail.");

  const { error } = await supabase.from("emails").insert({
    folder: "sent",
    sender_name: senderName,
    sender_email: senderEmail,
    recipient_email: recipient,
    subject,
    body,
  });

  if (error) return fail(`Could not send: ${error.message}`);

  return { ok: true, error: null, sentAt: Date.now() };
}

export type MailList = { emails: Email[]; error: string | null; signedIn: boolean };

// The shared inbox plus the signed-in user's own sent mail (enforced by RLS).
export async function listEmails(): Promise<MailList> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { emails: [], error: null, signedIn: false };

  const { data, error } = await supabase
    .from("emails")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  return { emails: (data as Email[]) ?? [], error: error?.message ?? null, signedIn: true };
}

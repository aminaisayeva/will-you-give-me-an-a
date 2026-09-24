"use server";

import { refresh } from "next/cache";
import { getSupabase } from "@/lib/supabase";

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

  // The table's row level security only lets the public insert into "sent".
  const { error } = await getSupabase().from("emails").insert({
    folder: "sent",
    sender_name: senderName,
    sender_email: senderEmail,
    recipient_email: recipient,
    subject,
    body,
  });

  if (error) return fail(`Could not send: ${error.message}`);

  refresh();
  return { ok: true, error: null, sentAt: Date.now() };
}

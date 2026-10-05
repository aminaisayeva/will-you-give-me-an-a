"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasFullName, MIN_PASSWORD } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";
import { UNLOCK_COOKIE, unlockCookieOptions } from "@/lib/lock";

export type LoginState = { error: string | null; notice: string | null };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

async function unlock() {
  (await cookies()).set(UNLOCK_COOKIE, "1", unlockCookieOptions);
}

const fail = (error: string): LoginState => ({ error, notice: null });

export async function signInWithPassword(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = field(formData, "email").toLowerCase();
  const password = typeof formData.get("password") === "string" ? (formData.get("password") as string) : "";
  if (!EMAIL_RE.test(email)) return fail("Enter the email for your account.");
  if (!password) return fail("Enter your password.");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    // Same wording as macOS for a wrong password; also covers unknown emails.
    return fail(
      error?.code === "email_not_confirmed"
        ? "Confirm your email first. Check your inbox for the link."
        : "Incorrect email or password.",
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", data.user.id)
    .maybeSingle();

  await unlock();
  redirect(hasFullName(profile) ? "/" : "/welcome");
}

export async function createAccount(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const firstName = field(formData, "first_name");
  const lastName = field(formData, "last_name");
  const email = field(formData, "email").toLowerCase();
  const password = typeof formData.get("password") === "string" ? (formData.get("password") as string) : "";
  const verify = typeof formData.get("verify") === "string" ? (formData.get("verify") as string) : "";

  if (!firstName || firstName.length > 60) return fail("Enter your first name (max 60 characters).");
  if (!lastName || lastName.length > 60) return fail("Enter your last name (max 60 characters).");
  if (!EMAIL_RE.test(email) || email.length > 254) return fail("That email address looks invalid.");
  if (password.length < MIN_PASSWORD) return fail(`Password must be at least ${MIN_PASSWORD} characters.`);
  if (password !== verify) return fail("The passwords don't match.");

  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("x-forwarded-host") ?? h.get("host")}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // The profiles trigger copies these into first_name / last_name.
      data: { first_name: firstName, last_name: lastName },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) return fail(error.message);

  // With "Confirm email" turned on, there's no session until they click the link.
  if (!data.session) {
    return {
      error: null,
      notice: `Almost there! We sent a confirmation link to ${email}.`,
    };
  }

  await unlock();
  redirect("/");
}

// Signed-in user on the lock screen pressing Continue.
export async function continueAsUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await unlock();
  redirect("/");
}

export async function continueAsGuest() {
  await unlock();
  redirect("/");
}

export async function lockScreen() {
  (await cookies()).delete(UNLOCK_COOKIE);
  redirect("/login");
}

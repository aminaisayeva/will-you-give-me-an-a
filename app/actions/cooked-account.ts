"use server";

import { headers } from "next/headers";
import { refresh } from "next/cache";
import { AVATAR_BUCKET, MIN_PASSWORD } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";
import { normaliseUsername, usernameProblem, type CookedProfile } from "@/lib/cooked";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PROFILE_COLUMNS = "user_id, username, display_name, avatar_path";

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function usernameTaken(supabase: Supabase, username: string, exceptUser?: string) {
  const { data } = await supabase.from("cooked_profiles").select("user_id").eq("username", username).maybeSingle();
  return Boolean(data && data.user_id !== exceptUser);
}

export type UsernameCheck = { ok: boolean; message: string };

export async function checkUsername(raw: string): Promise<UsernameCheck> {
  const username = normaliseUsername(raw);
  const problem = usernameProblem(username);
  if (problem) return { ok: false, message: problem };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (await usernameTaken(supabase, username, user?.id)) return { ok: false, message: `@${username} is taken.` };
  return { ok: true, message: `@${username} is available.` };
}

export type MyCookedAccount = {
  signedIn: boolean;
  profile: CookedProfile | null;
  // Suggestions for the create-profile form.
  suggestedUsername: string;
  suggestedName: string;
};

// The signed-in user's cooked.ai profile. If they signed up on cooked.ai and
// confirmed their email, their chosen @username is waiting in their account
// metadata: create the profile now.
export async function getMyCookedAccount(): Promise<MyCookedAccount> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { signedIn: false, profile: null, suggestedUsername: "", suggestedName: "" };

  const { data } = await supabase.from("cooked_profiles").select(PROFILE_COLUMNS).eq("user_id", user.id).maybeSingle();
  const { data: mac } = await supabase.from("profiles").select("first_name, last_name").eq("id", user.id).maybeSingle();
  const suggestedName = [mac?.first_name, mac?.last_name].filter(Boolean).join(" ") || String(user.user_metadata?.full_name ?? "");
  const wanted = normaliseUsername(String(user.user_metadata?.cooked_username ?? ""));

  if (data) return { signedIn: true, profile: data as CookedProfile, suggestedUsername: "", suggestedName };

  if (wanted && !usernameProblem(wanted) && !(await usernameTaken(supabase, wanted))) {
    const { data: created } = await supabase
      .from("cooked_profiles")
      .insert({ username: wanted, display_name: (suggestedName || wanted).slice(0, 40) })
      .select(PROFILE_COLUMNS)
      .single();
    if (created) return { signedIn: true, profile: created as CookedProfile, suggestedUsername: "", suggestedName };
  }

  const base = normaliseUsername((mac?.first_name ?? user.email?.split("@")[0] ?? "").toString()).slice(0, 16) || "cook";
  return { signedIn: true, profile: null, suggestedUsername: wanted || base, suggestedName };
}

export type ProfileResult = { ok: boolean; error: string | null; profile: CookedProfile | null };

export async function createCookedProfile(rawUsername: string, rawName: string): Promise<ProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in first.", profile: null };
  const username = normaliseUsername(rawUsername);
  const displayName = rawName.trim().slice(0, 40);
  const problem = usernameProblem(username);
  if (problem) return { ok: false, error: problem, profile: null };
  if (!displayName) return { ok: false, error: "Add a display name.", profile: null };
  if (await usernameTaken(supabase, username)) return { ok: false, error: `@${username} is taken. Try another one.`, profile: null };

  const { data, error } = await supabase
    .from("cooked_profiles")
    .insert({ username, display_name: displayName })
    .select(PROFILE_COLUMNS)
    .single();
  if (error) return { ok: false, error: error.code === "23505" ? `@${username} was just taken. Try another one.` : error.message, profile: null };
  return { ok: true, error: null, profile: data as CookedProfile };
}

const AVATAR_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

// Edit profile: name, username and (optionally) a new or removed avatar.
export async function updateCookedProfile(formData: FormData): Promise<ProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in first.", profile: null };

  const username = normaliseUsername(String(formData.get("username") ?? ""));
  const displayName = String(formData.get("display_name") ?? "").trim().slice(0, 40);
  const problem = usernameProblem(username);
  if (problem) return { ok: false, error: problem, profile: null };
  if (!displayName) return { ok: false, error: "Add a display name.", profile: null };
  if (await usernameTaken(supabase, username, user.id)) return { ok: false, error: `@${username} is taken.`, profile: null };

  const { data: current } = await supabase.from("cooked_profiles").select("avatar_path").eq("user_id", user.id).maybeSingle();
  const changes: { username: string; display_name: string; avatar_path?: string | null } = { username, display_name: displayName };

  const avatar = formData.get("avatar");
  if (avatar instanceof File && avatar.size > 0) {
    const ext = AVATAR_TYPES[avatar.type];
    if (!ext) return { ok: false, error: "Use a JPEG, PNG or WebP image.", profile: null };
    if (avatar.size > 2 * 1024 * 1024) return { ok: false, error: "That image is over 2 MB.", profile: null };
    const path = `${user.id}/cooked-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, avatar, { contentType: avatar.type, cacheControl: "31536000" });
    if (error) return { ok: false, error: `Couldn't upload the image: ${error.message}`, profile: null };
    changes.avatar_path = path;
  } else if (formData.get("remove_avatar") === "1") {
    changes.avatar_path = null;
  }

  const { data, error } = await supabase.from("cooked_profiles").update(changes).eq("user_id", user.id).select(PROFILE_COLUMNS).single();
  if (error) return { ok: false, error: error.message, profile: null };
  const old = current?.avatar_path;
  if (old && changes.avatar_path !== undefined && changes.avatar_path !== old) await supabase.storage.from(AVATAR_BUCKET).remove([old]);
  return { ok: true, error: null, profile: data as CookedProfile };
}

export type AuthResult = { ok: boolean; error: string | null; needsConfirmation?: boolean };

// Sign up from inside cooked.ai. It's the same account as the Mac, so this
// also signs you into the desktop.
export async function cookedSignUp(input: {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim().toLowerCase();
  const username = normaliseUsername(input.username);
  if (!firstName || firstName.length > 60) return { ok: false, error: "Enter your first name." };
  if (!lastName || lastName.length > 60) return { ok: false, error: "Enter your last name." };
  const problem = usernameProblem(username);
  if (problem) return { ok: false, error: problem };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "That email address looks invalid." };
  if (input.password.length < MIN_PASSWORD) return { ok: false, error: `Use a password of at least ${MIN_PASSWORD} characters.` };

  const supabase = await createClient();
  if (await usernameTaken(supabase, username)) return { ok: false, error: `@${username} is taken. Try another one.` };

  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("x-forwarded-host") ?? h.get("host")}`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: { first_name: firstName, last_name: lastName, cooked_username: username },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) return { ok: false, error: error.message };
  if (!data.session) return { ok: true, error: null, needsConfirmation: true };

  await supabase.from("cooked_profiles").insert({ username, display_name: `${firstName} ${lastName}`.slice(0, 40) });
  refresh();
  return { ok: true, error: null };
}

export async function cookedLogIn(input: { email: string; password: string }): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  if (!EMAIL_RE.test(email) || !input.password) return { ok: false, error: "Enter your email and password." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: input.password });
  if (error) {
    return {
      ok: false,
      error: error.code === "email_not_confirmed" ? "Confirm your email first. Check your inbox for the link." : "Incorrect email or password.",
    };
  }
  refresh();
  return { ok: true, error: null };
}

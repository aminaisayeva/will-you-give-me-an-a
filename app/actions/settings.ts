"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { AVATAR_BUCKET, getSupabase, MAX_AVATAR_BYTES, MIN_PASSWORD } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";

export type FormState = { ok: boolean; error: string | null; savedAt: number };

const AVATAR_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function secret(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

const fail = (error: string): FormState => ({ ok: false, error, savedAt: 0 });
const saved = (): FormState => ({ ok: true, error: null, savedAt: Date.now() });

function validateName(label: string, value: string) {
  if (!value) return `${label} is required.`;
  if (value.length > 60) return `${label} must be 60 characters or fewer.`;
  return null;
}

async function signedIn() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

async function saveNames(formData: FormData) {
  const firstName = field(formData, "first_name");
  const lastName = field(formData, "last_name");
  const invalid = validateName("First name", firstName) ?? validateName("Last name", lastName);
  if (invalid) return invalid;

  const { supabase, user } = await signedIn();
  const { error } = await supabase
    .from("profiles")
    .update({ first_name: firstName, last_name: lastName })
    .eq("id", user.id);
  return error ? `Could not save: ${error.message}` : null;
}

// Setup Assistant, right after the first sign-in.
export async function completeSetup(_prev: FormState, formData: FormData): Promise<FormState> {
  const error = await saveNames(formData);
  if (error) return fail(error);
  redirect("/");
}

// Users & Groups pane.
export async function updateName(_prev: FormState, formData: FormData): Promise<FormState> {
  const error = await saveNames(formData);
  if (error) return fail(error);
  refresh();
  return saved();
}

// Profile pane: upload a new photo or remove the current one.
export async function updatePhoto(_prev: FormState, formData: FormData): Promise<FormState> {
  const avatar = formData.get("avatar");
  const remove = formData.get("remove") === "1";
  const file = avatar instanceof File && avatar.size > 0 ? avatar : null;
  if (!file && !remove) return fail("Choose a photo first.");
  if (file) {
    if (!AVATAR_TYPES[file.type]) return fail("Photo must be a PNG, JPEG, WebP or GIF.");
    if (file.size > MAX_AVATAR_BYTES) return fail("Photo must be 4 MB or smaller.");
  }

  const { supabase, user } = await signedIn();
  const { data: current } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", user.id)
    .maybeSingle();
  const oldPath: string | null = current?.avatar_path ?? null;

  // The image goes to Storage; the table only keeps its path.
  let newPath: string | null = null;
  if (file) {
    newPath = `${user.id}/${Date.now()}.${AVATAR_TYPES[file.type]}`;
    const { error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(newPath, file, { contentType: file.type, cacheControl: "31536000" });
    if (error) return fail(`Could not upload photo: ${error.message}`);
  }

  const { error } = await supabase.from("profiles").update({ avatar_path: newPath }).eq("id", user.id);
  if (error) return fail(`Could not save: ${error.message}`);

  if (oldPath && oldPath !== newPath) {
    await supabase.storage.from(AVATAR_BUCKET).remove([oldPath]);
  }

  refresh();
  return saved();
}

// Login Password pane. Google-only accounts have no password yet, so they
// set one without an old password.
export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const oldPassword = secret(formData, "old_password");
  const newPassword = secret(formData, "new_password");
  const verify = secret(formData, "verify");

  if (newPassword.length < MIN_PASSWORD) return fail(`New password must be at least ${MIN_PASSWORD} characters.`);
  if (newPassword !== verify) return fail("The new passwords don't match.");

  const { supabase, user } = await signedIn();
  const { data: hasPassword } = await supabase.rpc("has_password");

  if (hasPassword) {
    if (!oldPassword) return fail("Enter your old password.");
    if (oldPassword === newPassword) return fail("The new password must be different from the old one.");
    // Check the old password with a throwaway client so the session cookies
    // of this request aren't touched.
    const { error } = await getSupabase().auth.signInWithPassword({
      email: user.email ?? "",
      password: oldPassword,
    });
    if (error) return fail("The old password is incorrect.");
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return fail(error.message);

  refresh();
  return saved();
}

"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { AVATAR_BUCKET, MAX_AVATAR_BYTES } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";

export type ProfileState = { ok: boolean; error: string | null; savedAt: number };

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

const fail = (error: string): ProfileState => ({ ok: false, error, savedAt: 0 });

function validateName(label: string, value: string) {
  if (!value) return `${label} is required.`;
  if (value.length > 60) return `${label} must be 60 characters or fewer.`;
  return null;
}

// Used by the Setup Assistant right after the first sign-in.
export async function completeSetup(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const firstName = field(formData, "first_name");
  const lastName = field(formData, "last_name");
  const invalid = validateName("First name", firstName) ?? validateName("Last name", lastName);
  if (invalid) return fail(invalid);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .update({ first_name: firstName, last_name: lastName })
    .eq("id", user.id);
  if (error) return fail(`Could not save: ${error.message}`);

  redirect("/");
}

// Used by the Profile window: names plus an optional new photo.
export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const firstName = field(formData, "first_name");
  const lastName = field(formData, "last_name");
  const invalid = validateName("First name", firstName) ?? validateName("Last name", lastName);
  if (invalid) return fail(invalid);

  const avatar = formData.get("avatar");
  const removeAvatar = formData.get("remove_avatar") === "1";
  const newFile = avatar instanceof File && avatar.size > 0 ? avatar : null;
  if (newFile) {
    if (!AVATAR_TYPES[newFile.type]) return fail("Photo must be a PNG, JPEG, WebP or GIF.");
    if (newFile.size > MAX_AVATAR_BYTES) return fail("Photo must be 4 MB or smaller.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: current } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", user.id)
    .maybeSingle();
  const oldPath: string | null = current?.avatar_path ?? null;

  const changes: { first_name: string; last_name: string; avatar_path?: string | null } = {
    first_name: firstName,
    last_name: lastName,
  };

  // The image goes to Storage; the table only keeps its path.
  if (newFile) {
    const path = `${user.id}/${Date.now()}.${AVATAR_TYPES[newFile.type]}`;
    const { error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, newFile, { contentType: newFile.type, cacheControl: "31536000" });
    if (error) return fail(`Could not upload photo: ${error.message}`);
    changes.avatar_path = path;
  } else if (removeAvatar) {
    changes.avatar_path = null;
  }

  const { error } = await supabase.from("profiles").update(changes).eq("id", user.id);
  if (error) return fail(`Could not save: ${error.message}`);

  if (oldPath && changes.avatar_path !== undefined && changes.avatar_path !== oldPath) {
    await supabase.storage.from(AVATAR_BUCKET).remove([oldPath]);
  }

  refresh();
  return { ok: true, error: null, savedAt: Date.now() };
}

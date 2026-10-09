"use server";

import { createClient } from "@/lib/supabase/server";

const ID_RE = /^[a-z0-9-]{3,60}$/;

export async function listProgress(): Promise<string[] | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("course_progress").select("lesson_id");
  return (data ?? []).map((r) => r.lesson_id as string);
}

// Record completed lessons (also used to merge a guest's progress after they
// sign in). Returns the full list afterwards.
export async function saveProgress(lessonIds: string[]): Promise<string[] | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const ids = [...new Set(lessonIds)].filter((id) => ID_RE.test(id)).slice(0, 100);
  if (ids.length) {
    const { data: existing } = await supabase.from("course_progress").select("lesson_id").in("lesson_id", ids);
    const have = new Set((existing ?? []).map((r) => r.lesson_id as string));
    const missing = ids.filter((id) => !have.has(id));
    if (missing.length) await supabase.from("course_progress").insert(missing.map((lesson_id) => ({ lesson_id })));
  }
  return listProgress();
}

export async function resetProgress(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { error } = await supabase.from("course_progress").delete().eq("user_id", user.id);
  return !error;
}

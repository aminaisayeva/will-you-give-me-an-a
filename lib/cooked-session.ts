import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { getAccount } from "@/lib/auth";
import { normaliseUsername, usernameProblem, type CookedProfile } from "@/lib/cooked";
import { createClient } from "@/lib/supabase/server";

export type CookedSession = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  profile: CookedProfile | null; // their public cooked.ai profile
};

// The signed-in cooked.ai user, or null. Deduplicated per request.
export const getCookedSession = cache(async (): Promise<CookedSession | null> => {
  const account = await getAccount();
  if (!account) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("cooked_profiles")
    .select("user_id, username, display_name, avatar_path")
    .eq("user_id", account.user.id)
    .maybeSingle();
  return {
    userId: account.user.id,
    email: account.user.email ?? "",
    firstName: account.profile?.first_name ?? "",
    lastName: account.profile?.last_name ?? "",
    profile: (data as CookedProfile | null) ?? null,
  };
});

// Everyone needs a first and last name (assignment 3) and a @username.
export function needsOnboarding(session: CookedSession) {
  return !session.firstName.trim() || !session.lastName.trim() || !session.profile;
}

// Email sign-ups choose their @username before confirming their email; it
// waits in their account metadata. Create the profile from it if we can, so
// they skip onboarding.
export async function profileFromSignupMetadata(supabase: Awaited<ReturnType<typeof createClient>>, user: User) {
  const wanted = normaliseUsername(String(user.user_metadata?.cooked_username ?? ""));
  if (!wanted || usernameProblem(wanted)) return;
  const { data: existing } = await supabase.from("cooked_profiles").select("user_id").eq("user_id", user.id).maybeSingle();
  if (existing) return;
  const { data: taken } = await supabase.from("cooked_profiles").select("user_id").eq("username", wanted).maybeSingle();
  if (taken) return;
  const name = [user.user_metadata?.first_name, user.user_metadata?.last_name].filter(Boolean).join(" ") || wanted;
  await supabase.from("cooked_profiles").insert({ username: wanted, display_name: String(name).slice(0, 40) });
}

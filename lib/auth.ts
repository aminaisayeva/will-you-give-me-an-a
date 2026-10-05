import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";

export type Account = { user: User; profile: Profile | null };

// The signed-in user and their profile row, or null. Deduplicated per request.
export const getAccount = cache(async (): Promise<Account | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  return { user, profile };
});

// For gated pages: the proxy already redirects, this is the real check.
export async function requireAccount(): Promise<Account> {
  const account = await getAccount();
  if (!account) redirect("/login");
  return account;
}

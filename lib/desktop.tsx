import { redirect } from "next/navigation";
import Desktop, { type InitialWindow } from "@/components/os/Desktop";
import type { DesktopAccount } from "@/components/os/AccountContext";
import { getAccount } from "@/lib/auth";
import { googlePicture, toMenuAccount } from "@/lib/menu-account";
import { avatarUrl, hasFullName } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";

function loginMethods(providers: unknown) {
  const list = Array.isArray(providers) ? providers.map(String) : [];
  const names = list.map((p) => (p === "google" ? "Google" : p === "email" ? "Email & password" : p));
  return names.join(", ") || "Email & password";
}

// Everything the desktop's windows need about the signed-in user, in one
// server render. Server Actions call refresh(), which re-runs this.
async function desktopAccount(): Promise<DesktopAccount | null> {
  const account = await getAccount();
  const menu = toMenuAccount(account);
  if (!account || !menu) return null;
  const { user, profile } = account;
  if (!hasFullName(profile)) redirect("/welcome");

  const { data: hasPassword } = await (await createClient()).rpc("has_password");
  return {
    ...menu,
    id: user.id,
    firstName: profile?.first_name ?? "",
    lastName: profile?.last_name ?? "",
    photo: avatarUrl(profile?.avatar_path ?? null),
    googlePhoto: googlePicture(user.user_metadata),
    memberSince: profile?.created_at ?? user.created_at,
    hasPassword: Boolean(hasPassword),
    loginMethods: loginMethods(user.app_metadata?.providers),
  };
}

export async function renderDesktop(initial: InitialWindow[]) {
  return <Desktop account={await desktopAccount()} initial={initial} />;
}

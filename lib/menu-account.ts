import type { Account } from "@/lib/auth";
import { avatarUrl, displayName } from "@/lib/supabase";
import type { MenuAccount } from "@/components/MenuBar";

// The small slice of the account that client components need.
export function toMenuAccount(account: Account | null): MenuAccount | null {
  if (!account) return null;
  const { user, profile } = account;
  return {
    name: displayName(profile, user.email ?? "Guest"),
    email: user.email ?? null,
    avatar: avatarUrl(profile?.avatar_path ?? null) ?? googlePicture(user.user_metadata),
  };
}

export function googlePicture(meta: Record<string, unknown> | undefined): string | null {
  const pic = meta?.avatar_url ?? meta?.picture;
  return typeof pic === "string" ? pic : null;
}

import { requireAccount } from "@/lib/auth";
import { googlePicture } from "@/lib/menu-account";
import { avatarUrl, displayName } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";
import ProfilePane from "./ProfilePane";

export default async function ProfileSettingsPage() {
  const { user, profile } = await requireAccount();
  const { data: hasPassword } = await (await createClient()).rpc("has_password");

  return (
    <ProfilePane
      name={displayName(profile, user.email ?? "")}
      email={user.email ?? ""}
      photo={avatarUrl(profile?.avatar_path ?? null)}
      googlePhoto={googlePicture(user.user_metadata)}
      memberSince={profile?.created_at ?? user.created_at}
      hasPassword={Boolean(hasPassword)}
    />
  );
}

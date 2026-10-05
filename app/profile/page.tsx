import type { Metadata } from "next";
import { requireAccount } from "@/lib/auth";
import { avatarUrl } from "@/lib/supabase";
import { googlePicture, toMenuAccount } from "@/lib/menu-account";
import ProfileSettings from "./ProfileSettings";

export const metadata: Metadata = {
  title: "Profile · Will you give me an A?",
};

export default async function ProfilePage() {
  const account = await requireAccount();
  const { user, profile } = account;

  return (
    <ProfileSettings
      menuAccount={toMenuAccount(account)}
      email={user.email ?? ""}
      firstName={profile?.first_name ?? ""}
      lastName={profile?.last_name ?? ""}
      avatar={avatarUrl(profile?.avatar_path ?? null)}
      googleAvatar={googlePicture(user.user_metadata)}
      memberSince={profile?.created_at ?? user.created_at}
    />
  );
}

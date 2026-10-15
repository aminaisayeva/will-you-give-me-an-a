import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import SettingsForms from "@/components/cooked/SettingsForms";
import { getCookedSession, needsOnboarding } from "@/lib/cooked-session";
import { avatarUrl } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Settings" };

// Account settings: public profile, name, password. Signed-in users only.
export default async function ProfilePage() {
  const session = await getCookedSession();
  if (!session) redirect("/login");
  if (needsOnboarding(session) || !session.profile) redirect("/onboarding");
  const supabase = await createClient();
  const { data: hasPassword } = await supabase.rpc("has_password");
  const { profile } = session;

  return (
    <main className="mx-auto max-w-4xl px-4 pb-16 pt-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[28px] font-extrabold tracking-[-0.02em] text-stone-900">Settings</h1>
        <Link href={`/u/${profile.username}`} className="text-[14px] font-semibold text-orange-700 hover:underline">
          View your profile →
        </Link>
      </div>
      <SettingsForms
        email={session.email}
        firstName={session.firstName}
        lastName={session.lastName}
        username={profile.username}
        displayName={profile.display_name}
        avatar={avatarUrl(profile.avatar_path)}
        hasPassword={Boolean(hasPassword)}
      />
    </main>
  );
}

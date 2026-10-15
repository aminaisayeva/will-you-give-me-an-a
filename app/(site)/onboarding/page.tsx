import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthCard from "@/components/cooked/AuthCard";
import OnboardingForm from "@/components/cooked/OnboardingForm";
import { getAccount } from "@/lib/auth";
import { getCookedSession, needsOnboarding } from "@/lib/cooked-session";
import { normaliseUsername } from "@/lib/cooked";

export const metadata: Metadata = { title: "Finish your profile" };

function splitName(full: string) {
  const [first = "", ...rest] = full.trim().split(/\s+/);
  return { first, last: rest.join(" ") };
}

// After the first sign-in (e.g. with Google): name, @username, photo.
export default async function OnboardingPage() {
  const session = await getCookedSession();
  if (!session) redirect("/login");
  if (!needsOnboarding(session)) redirect("/feed");

  const account = await getAccount();
  const meta = account?.user.user_metadata ?? {};
  const google = splitName(String(meta.full_name ?? meta.name ?? ""));
  const first = session.firstName || google.first;
  const last = session.lastName || google.last;
  const suggested =
    session.profile?.username ??
    (normaliseUsername(String(meta.cooked_username ?? "")) ||
      normaliseUsername(first.replace(/[^A-Za-z0-9_]/g, "")).slice(0, 16) ||
      normaliseUsername(session.email.split("@")[0].replace(/[^A-Za-z0-9_]/g, "")).slice(0, 16));

  return (
    <AuthCard title="Finish your profile" subtitle="Tell us your name and pick a @username. It takes ten seconds.">
      <OnboardingForm firstName={first} lastName={last} username={suggested} email={session.email} />
    </AuthCard>
  );
}

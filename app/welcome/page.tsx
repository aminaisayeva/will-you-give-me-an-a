import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { hasFullName } from "@/lib/supabase";
import SetupAssistant from "./SetupAssistant";

export const metadata: Metadata = {
  title: "Setup Assistant · Will you give me an A?",
};

function suggestedNames(meta: Record<string, unknown>) {
  const full = typeof meta.full_name === "string" ? meta.full_name : typeof meta.name === "string" ? meta.name : "";
  const [first = "", ...rest] = full.trim().split(/\s+/);
  return { first, last: rest.join(" ") };
}

export default async function WelcomePage() {
  const { user, profile } = await requireAccount();
  if (hasFullName(profile)) redirect("/");

  // Suggest what Google told us, but the user confirms it here.
  const suggested = suggestedNames(user.user_metadata ?? {});
  return (
    <SetupAssistant
      email={user.email ?? ""}
      firstName={profile?.first_name ?? suggested.first}
      lastName={profile?.last_name ?? suggested.last}
    />
  );
}

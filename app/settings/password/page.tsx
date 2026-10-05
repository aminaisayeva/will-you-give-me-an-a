import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PasswordPane from "./PasswordPane";

export default async function PasswordSettingsPage() {
  const { user } = await requireAccount();
  const { data: hasPassword } = await (await createClient()).rpc("has_password");
  return <PasswordPane email={user.email ?? ""} hasPassword={Boolean(hasPassword)} />;
}

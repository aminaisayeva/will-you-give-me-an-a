import { redirect } from "next/navigation";
import { getAccount } from "@/lib/auth";
import { toMenuAccount } from "@/lib/menu-account";
import { hasFullName } from "@/lib/supabase";
import Desktop from "./Desktop";

export default async function Page() {
  const account = await getAccount();
  // Signed in but no name yet: finish setup first.
  if (account && !hasFullName(account.profile)) redirect("/welcome");

  return <Desktop account={toMenuAccount(account)} />;
}

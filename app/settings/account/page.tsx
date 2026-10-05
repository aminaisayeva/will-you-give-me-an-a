import { requireAccount } from "@/lib/auth";
import { toMenuAccount } from "@/lib/menu-account";
import AccountPane from "./AccountPane";

function loginMethods(providers: unknown) {
  const list = Array.isArray(providers) ? providers.map(String) : [];
  const names = list.map((p) => (p === "google" ? "Google" : p === "email" ? "Email & password" : p));
  return names.join(", ") || "Email & password";
}

export default async function AccountSettingsPage() {
  const account = await requireAccount();
  const { user, profile } = account;
  const menu = toMenuAccount(account)!;

  return (
    <AccountPane
      name={menu.name}
      avatar={menu.avatar}
      email={user.email ?? ""}
      firstName={profile?.first_name ?? ""}
      lastName={profile?.last_name ?? ""}
      loginMethods={loginMethods(user.app_metadata?.providers)}
    />
  );
}

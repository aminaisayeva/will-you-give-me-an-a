import type { Metadata } from "next";
import { getAccount } from "@/lib/auth";
import { isGoogleEnabled } from "@/lib/auth-providers";
import { toMenuAccount } from "@/lib/menu-account";
import LoginScreen from "./LoginScreen";

export const metadata: Metadata = {
  title: "Log In · Will you give me an A?",
  description: "Sign in to unlock your desktop, transcript and settings.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  const [account, googleEnabled] = await Promise.all([getAccount(), isGoogleEnabled()]);
  const menuAccount = toMenuAccount(account);
  const user = account && menuAccount
    ? {
        greeting: account.profile?.first_name?.trim() || menuAccount.name,
        name: menuAccount.name,
        avatar: menuAccount.avatar,
      }
    : null;

  return (
    <LoginScreen
      user={user}
      googleEnabled={googleEnabled}
      error={typeof error === "string" ? error : null}
    />
  );
}

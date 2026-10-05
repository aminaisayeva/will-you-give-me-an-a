import type { Metadata } from "next";
import { requireAccount } from "@/lib/auth";
import { toMenuAccount } from "@/lib/menu-account";
import SettingsShell from "./SettingsShell";

export const metadata: Metadata = {
  title: "System Settings · Will you give me an A?",
};

export default async function SettingsLayout({ children }: LayoutProps<"/settings">) {
  const account = await requireAccount();
  return <SettingsShell account={toMenuAccount(account)!}>{children}</SettingsShell>;
}

import type { Metadata } from "next";
import { renderDesktop } from "@/lib/desktop";

export const metadata: Metadata = { title: "System Settings · Will you give me an A?" };

// /settings, /settings/profile, /settings/account, /settings/password
export default async function SettingsPage({ params }: PageProps<"/settings/[[...pane]]">) {
  const { pane } = await params;
  return renderDesktop([{ id: "settings", params: pane?.[0] ? { pane: pane[0] } : undefined }]);
}

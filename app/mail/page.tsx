import type { Metadata } from "next";
import { renderDesktop } from "@/lib/desktop";

export const metadata: Metadata = { title: "Mail · Will you give me an A?" };

export default async function MailPage() {
  return renderDesktop([{ id: "mail" }]);
}

import type { Metadata } from "next";
import { renderDesktop } from "@/lib/desktop";

export const metadata: Metadata = { title: "Terminal · Terminal Academy" };

export default async function TerminalPage() {
  return renderDesktop([{ id: "terminal" }]);
}

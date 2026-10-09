import type { Metadata } from "next";
import { renderDesktop } from "@/lib/desktop";

export const metadata: Metadata = { title: "Terminal Academy · Learn the terminal" };

export default async function AcademyPage() {
  return renderDesktop([{ id: "academy" }]);
}

import type { Metadata } from "next";
import { renderDesktop } from "@/lib/desktop";

export const metadata: Metadata = { title: "final_grade.pdf · Terminal Academy" };

// Gated: proxy.ts sends signed-out visitors to /login first.
export default async function TranscriptPage() {
  return renderDesktop([{ id: "transcript" }]);
}

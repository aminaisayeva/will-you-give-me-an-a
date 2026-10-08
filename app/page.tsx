import { renderDesktop } from "@/lib/desktop";

// The desktop greets you with cooked.ai open in Safari. Grade Request.app is
// still on the desktop.
export default async function Page() {
  return renderDesktop([{ id: "safari", params: { url: "cooked.ai" } }]);
}

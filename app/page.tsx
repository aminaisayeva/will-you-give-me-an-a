import { renderDesktop } from "@/lib/desktop";

// The desktop greets you with the Grade Request popup.
export default async function Page() {
  return renderDesktop([{ id: "grade" }]);
}

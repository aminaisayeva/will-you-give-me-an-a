import { renderDesktop } from "@/lib/desktop";

// Everyone lands on the desktop (guests included). Sticky notes explain the
// site and point to Terminal Academy.
export default async function Page() {
  return renderDesktop([]);
}

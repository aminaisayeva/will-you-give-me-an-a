import SiteHeader, { type Viewer } from "@/components/cooked/SiteHeader";
import { getCookedSession } from "@/lib/cooked-session";
import { avatarUrl } from "@/lib/supabase";

// The cooked.ai site: header, page, footer.
export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const session = await getCookedSession();
  const viewer: Viewer = session
    ? {
        username: session.profile?.username ?? null,
        displayName: session.profile?.display_name ?? ([session.firstName, session.lastName].filter(Boolean).join(" ") || session.email),
        avatar: avatarUrl(session.profile?.avatar_path ?? null),
      }
    : null;

  return (
    <div className="flex min-h-dvh flex-col bg-[#fbf7f2] text-stone-900">
      <SiteHeader viewer={viewer} />
      <div className="flex-1">{children}</div>
      <footer className="border-t border-stone-200/80">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-6 text-[12.5px] text-stone-500">
          <span className="font-semibold text-stone-700">cooked.ai</span>
          <span>Captions written by Google Gemini. Every post shows its prompt.</span>
          <span className="ml-auto">A Columbia Generative AI class project</span>
        </div>
      </footer>
    </div>
  );
}

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SamplePost, WelcomeSections } from "@/components/safari/cooked/Welcome";
import { focusRing } from "@/components/safari/cooked/shared";
import { getCookedSession, needsOnboarding } from "@/lib/cooked-session";

// Landing page for visitors. Signed-in people go straight to the feed.
export default async function LandingPage() {
  const session = await getCookedSession();
  if (session) redirect(needsOnboarding(session) ? "/onboarding" : "/feed");

  return (
    <main className="@container">
      <div className="mx-auto max-w-5xl px-6 pb-16 pt-10 @3xl:px-10 @3xl:pt-16">
        <section className="grid items-center gap-10 @3xl:grid-cols-[1.05fr_1fr]">
          <div>
            <h1 className="text-[38px] font-extrabold leading-[1.04] tracking-[-0.025em] [text-wrap:balance] @3xl:text-[52px]">
              Post a pic. AI roasts it. Everyone votes on who cooked.
            </h1>
            <p className="mt-5 max-w-[46ch] text-[16px] leading-relaxed text-stone-600 [text-wrap:pretty]">
              Upload any photo and get four captions written by AI, each in a different voice. Then everyone decides which one was the funniest.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link
                href="/signup"
                className={`flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-[15px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(194,65,12,0.6)] transition hover:bg-orange-700 active:translate-y-px ${focusRing}`}
              >
                Create your account <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/feed" className={`rounded text-[15px] font-medium text-stone-700 underline-offset-4 hover:underline ${focusRing}`}>
                Browse the feed
              </Link>
            </div>
            <p className="mt-3 text-[13px] text-stone-500">
              Free. Sign up with Google or email.{" "}
              <Link href="/login" className={`rounded font-semibold text-orange-700 underline-offset-4 hover:underline ${focusRing}`}>
                Already have an account? Log in
              </Link>
            </p>
          </div>
          <SamplePost />
        </section>
        <WelcomeSections />
      </div>
    </main>
  );
}

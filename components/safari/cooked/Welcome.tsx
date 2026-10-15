"use client";

import { ArrowRight, Camera, ChevronUp, Flame, Globe, ScrollText, Undo2 } from "lucide-react";
import { focusRing, VOICES } from "./shared";

const SAMPLE = [
  { style: "Chronically Online", emoji: "\u{1F480}", text: "the way this slice is holding on for dear life", score: 5 },
  { style: "Midwest Mom", emoji: "\u{1F33D}", text: "Oh honey, is that dinner? I’m mailing you a casserole.", score: 3 },
  { style: "Real New Yorker", emoji: "\u{1F5FD}", text: "$1.50 and you still folded it wrong.", score: 12 },
  { style: "Columbia Tour Guide", emoji: "\u{1F981}", text: "Our students enjoy a rich culinary tradition just steps from Low Library!", score: 2 },
];

const STEPS = [
  { title: "Post a photo", text: "Your dorm, your lunch, your 1 train commute. Add a line of context if you want." },
  { title: "AI writes four captions", text: "Google Gemini looks at the photo and roasts it in four different voices." },
  { title: "Everyone votes", text: "Upvote the caption that cooked hardest. The winner gets the COOKED flag; the day’s best caption gets the banner." },
];

const GOOD_TO_KNOW = [
  { icon: Globe, title: "Posts are public", text: "Don’t post people without asking." },
  { icon: Undo2, title: "Votes can change", text: "Tap the same arrow to undo." },
  { icon: Camera, title: "15 pics a day", text: "Per person, so the oven stays cool." },
  { icon: ScrollText, title: "See the prompt", text: "Every post shows what the AI was asked." },
];

// First-visit landing page for cooked.ai.
export default function Welcome({
  signedIn,
  hasProfile,
  onPost,
  onBrowse,
  onSignUp,
  onLogIn,
}: {
  signedIn: boolean;
  hasProfile: boolean;
  onPost: () => void;
  onBrowse: () => void;
  onSignUp: () => void;
  onLogIn: () => void;
}) {
  return (
    <div className="@container h-full overflow-y-auto bg-[#fbf7f2] text-stone-900">
      <div className="mx-auto max-w-5xl px-6 pb-14 pt-10 @3xl:px-10 @3xl:pt-14">
        {/* Hero: copy on the left, an example post on the right */}
        <section className="grid items-center gap-10 @3xl:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="flex items-center gap-2 text-[13px] font-semibold text-orange-700">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-600 text-white">
                <Flame className="h-3.5 w-3.5" />
              </span>
              cooked.ai
            </p>
            <h1 className="mt-4 text-[34px] font-extrabold leading-[1.05] tracking-[-0.02em] [text-wrap:balance] @3xl:text-[44px]">
              Post a pic. AI roasts it. Everyone votes on who cooked.
            </h1>
            <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-stone-600 [text-wrap:pretty]">
              Upload any photo and get four captions written by AI, each in a different voice. Then the internet decides which one was the
              funniest.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              {signedIn && hasProfile ? (
                <button
                  type="button"
                  onClick={onPost}
                  className={`flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-[15px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(194,65,12,0.6)] transition hover:bg-orange-700 active:translate-y-px ${focusRing}`}
                >
                  Post your first pic <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onSignUp}
                  className={`flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-[15px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(194,65,12,0.6)] transition hover:bg-orange-700 active:translate-y-px ${focusRing}`}
                >
                  {signedIn ? "Create your profile" : "Create your account"} <ArrowRight className="h-4 w-4" />
                </button>
              )}
              <button type="button" onClick={onBrowse} className={`rounded text-[14px] font-medium text-stone-700 underline-offset-4 hover:underline ${focusRing}`}>
                Just browse for now
              </button>
            </div>
            {!signedIn && (
              <p className="mt-3 text-[12.5px] text-stone-500">
                Anyone can browse. Posting and voting need a free account.{" "}
                <button type="button" onClick={onLogIn} className={`rounded font-semibold text-orange-700 underline-offset-4 hover:underline ${focusRing}`}>
                  Already have one? Log in
                </button>
              </p>
            )}
          </div>

          <SamplePost />
        </section>

        <WelcomeSections />
      </div>
    </div>
  );
}

export function SamplePost() {
  return (
    <figure aria-label="Example post" className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-3 -z-0 rotate-2 rounded-[28px] bg-orange-200/50" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-[0_20px_45px_-20px_rgba(120,53,15,0.45)] ring-1 ring-stone-200">
        <div className="flex h-36 items-center justify-center bg-[radial-gradient(circle_at_30%_30%,#fde68a,#f59e0b_55%,#b45309)] text-[64px]" aria-hidden="true">
          {"\u{1F355}"}
        </div>
        <div className="p-4">
          <p className="text-[12px] text-stone-500">
            <span className="font-semibold text-stone-800">Priya Raman</span> · 2h · “my $1.50 slice on Broadway”
          </p>
          <ul className="mt-3 space-y-1.5">
            {SAMPLE.map((c) => {
              const best = c.score === 12;
              return (
                <li
                  key={c.style}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 ${best ? "bg-orange-50 ring-1 ring-orange-300" : "bg-stone-50"}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-[10.5px] font-semibold text-stone-500">
                      <span aria-hidden="true">{c.emoji}</span> {c.style}
                      {best && <span className="rounded-sm bg-orange-600 px-1 text-[9.5px] font-bold tracking-wide text-white">COOKED</span>}
                    </p>
                    <p className="text-[13px] leading-snug">{c.text}</p>
                  </div>
                  <span className={`flex shrink-0 items-center gap-0.5 text-[12px] font-bold tabular-nums ${best ? "text-orange-600" : "text-stone-500"}`}>
                    <ChevronUp className="h-4 w-4" strokeWidth={2.5} /> {c.score}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <figcaption className="sr-only">An example: four AI captions on a pizza photo, with votes.</figcaption>
    </figure>
  );
}

// "How it works", the four voices and "Good to know". Shared with the
// standalone landing page.
export function WelcomeSections() {
  return (
    <>
        {/* How it works */}
        <section className="mt-16" aria-labelledby="how-it-works">
          <h2 id="how-it-works" className="text-[20px] font-bold tracking-tight">
            How it works
          </h2>
          <ol className="mt-5 grid gap-6 @2xl:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="text-[34px] font-black leading-none text-orange-600/80 tabular-nums">{i + 1}</span>
                <div>
                  <p className="text-[15px] font-semibold">{s.title}</p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-stone-600">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* The four voices: its own section; swipeable on narrow screens */}
        <section className="mt-16" aria-labelledby="voices">
          <h2 id="voices" className="text-[20px] font-bold tracking-tight">
            The four voices
          </h2>
          <p className="mt-1 text-[13.5px] text-stone-600">Every photo gets one caption from each.</p>
          <ul className="-mx-6 mt-5 flex snap-x snap-mandatory scroll-px-6 gap-3 overflow-x-auto px-6 pb-2 @3xl:mx-0 @3xl:grid @3xl:grid-cols-4 @3xl:overflow-visible @3xl:px-0">
            {VOICES.map((v) => (
              <li key={v.style} className="w-44 shrink-0 snap-start rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200 @3xl:w-auto">
                <span className="text-[28px] leading-none" aria-hidden="true">
                  {v.emoji}
                </span>
                <p className="mt-3 text-[14px] font-semibold leading-tight">{v.style}</p>
                <p className="mt-1 text-[13px] leading-snug text-stone-600">{v.line}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Good to know: short tiles, one idea each */}
        <section className="mt-14" aria-labelledby="good-to-know">
          <h2 id="good-to-know" className="text-[20px] font-bold tracking-tight">
            Good to know
          </h2>
          <ul className="mt-5 grid gap-3 @lg:grid-cols-2 @4xl:grid-cols-4">
            {GOOD_TO_KNOW.map((g) => (
              <li key={g.title} className="flex items-start gap-3 rounded-2xl bg-white/70 p-4 ring-1 ring-stone-200">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                  <g.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[14px] font-semibold leading-tight">{g.title}</p>
                  <p className="mt-1 text-[13px] leading-snug text-stone-600">{g.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
    </>
  );
}

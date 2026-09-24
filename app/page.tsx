"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { FONT_STACK, WALLPAPER } from "@/lib/desktop-theme";

const MAX_NO_ATTEMPTS = 20;

const NO_LABELS = [
  "No",
  "Are you sure?",
  "Really?",
  "Think again",
  "That was a typo",
  "You missed",
  "Nice try",
  "The Yes is right there →",
  "Denial stage detected",
  "Resistance is futile",
];

const MENU_ITEMS = ["File", "Edit", "View", "Go", "Window", "Help"];

type DockApp = {
  glyph: string;
  label: string;
  bg: string;
  running?: boolean;
  href?: string;
};

const DOCK_APPS: DockApp[] = [
  {
    glyph: "\u{1F310}",
    label: "Safari",
    bg: "linear-gradient(180deg, #67d1ff 0%, #1d6ff2 100%)",
    running: true,
  },
  {
    glyph: "\u{1F4DD}",
    label: "Notes",
    bg: "linear-gradient(180deg, #fffbe8 0%, #f4d35e 100%)",
  },
  {
    glyph: "\u{1F3B5}",
    label: "Music",
    bg: "linear-gradient(180deg, #fc5c7d 0%, #d5326f 100%)",
  },
  {
    glyph: "\u{1F4F8}",
    label: "Photos",
    bg: "conic-gradient(from 40deg, #ff5e5e, #ffb340, #ffe14d, #6fd66f, #4dc4ff, #b06ffb, #ff5e9d, #ff5e5e)",
  },
  {
    glyph: "\u{1F4AC}",
    label: "Messages",
    bg: "linear-gradient(180deg, #7ef07e 0%, #0fbd2e 100%)",
    running: true,
  },
  {
    glyph: "\u{1F4E7}",
    label: "Mail",
    bg: "linear-gradient(180deg, #4facfe 0%, #0757c9 100%)",
    href: "/mail",
  },
  {
    glyph: "⚙️",
    label: "System Settings",
    bg: "linear-gradient(180deg, #e3e3e8 0%, #8e8e98 100%)",
  },
];

const TRASH_APP: DockApp = {
  glyph: "\u{1F5D1}\uFE0F",
  label: "Trash",
  bg: "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(190,196,205,0.55) 100%)",
};

const CONFETTI_GLYPHS = [
  "\u{1F389}",
  "\u{1F38A}",
  "✨",
  "⭐",
  "\u{1F4AF}",
  "\u{1F170}\uFE0F",
];


function formatMacClock(d: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const hours = d.getHours();
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  const mins = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours < 12 ? "AM" : "PM";
  return `${days[d.getDay()]} ${months[d.getMonth()]} ${d.getDate()}  ${h12}:${mins} ${ampm}`;
}

type ConfettiPiece = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  glyph: string;
};

export default function Page() {
  const [clock, setClock] = useState("");
  const [noAttempts, setNoAttempts] = useState(0);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const tick = () => setClock(formatMacClock(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const confetti: ConfettiPiece[] = useMemo(() => {
    if (!accepted) return [];
    return Array.from({ length: 44 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: -(Math.random() * 5),
      duration: 3.2 + Math.random() * 3.8,
      size: 16 + Math.random() * 24,
      glyph: CONFETTI_GLYPHS[i % CONFETTI_GLYPHS.length],
    }));
  }, [accepted]);

  const yesTakeover = noAttempts >= MAX_NO_ATTEMPTS && !accepted;
  const noLabel = NO_LABELS[noAttempts % NO_LABELS.length];

  const handleNo = () => {
    setNoAttempts((n) => Math.min(n + 1, MAX_NO_ATTEMPTS));
  };

  const handleYes = () => {
    setAccepted(true);
  };

  // Runtime-derived sizing for the ever-growing Yes button.
  const yesStyle: CSSProperties = {
    background: "linear-gradient(180deg, #0a84ff 0%, #007aff 100%)",
    color: "#fff",
    fontWeight: 600,
    fontSize: `${13 + noAttempts * 2.6}px`,
    padding: `${8 + noAttempts * 2}px ${20 + noAttempts * 5}px`,
    borderRadius: `${8 + noAttempts * 0.8}px`,
    boxShadow: `0 ${4 + noAttempts}px ${12 + noAttempts * 2}px rgba(10,132,255,0.45), inset 0 1px 0 rgba(255,255,255,0.25)`,
    transition: "all 320ms cubic-bezier(0.34, 1.4, 0.64, 1)",
    lineHeight: 1.2,
  };

  const noStyle: CSSProperties = {
    fontSize: `${Math.max(13 - noAttempts * 0.35, 9)}px`,
    opacity: Math.max(1 - noAttempts * 0.02, 0.6),
    transition: "all 320ms ease",
  };

  const dialogWidth = `min(${430 + noAttempts * 12}px, 94vw)`;
  const shakeName = noAttempts % 2 === 1 ? "alert-shake" : "alert-shake-b";

  return (
    <div
      className="fixed inset-0 select-none overflow-hidden"
      style={{ fontFamily: FONT_STACK, background: WALLPAPER }}
    >
      <style>{`
        @keyframes alert-shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-14px) rotate(-0.6deg); }
          30% { transform: translateX(12px) rotate(0.6deg); }
          45% { transform: translateX(-9px); }
          60% { transform: translateX(7px); }
          75% { transform: translateX(-4px); }
          90% { transform: translateX(2px); }
        }
        @keyframes alert-shake-b {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-14px) rotate(-0.6deg); }
          30% { transform: translateX(12px) rotate(0.6deg); }
          45% { transform: translateX(-9px); }
          60% { transform: translateX(7px); }
          75% { transform: translateX(-4px); }
          90% { transform: translateX(2px); }
        }
        @keyframes dialog-pop {
          from { opacity: 0; transform: scale(0.92) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(28px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes confetti-fall {
          0% { transform: translateY(-12vh) rotate(0deg); }
          100% { transform: translateY(112vh) rotate(720deg); }
        }
        @keyframes yes-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>

      {/* Vignette over the wallpaper */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 40%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%)",
        }}
      />

      {/* Menu bar */}
      <header className="absolute inset-x-0 top-0 z-40 flex h-7 items-center justify-between border-b border-white/10 bg-black/30 px-4 text-[13px] text-white/90 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <span aria-hidden="true" className="text-[15px] leading-none">
            {""}
          </span>
          <span className="font-semibold">Finder</span>
          {MENU_ITEMS.map((item) => (
            <span key={item} className="hidden sm:inline">
              {item}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3.5">
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
            <path
              d="M8 10.8a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6Z"
              fill="currentColor"
            />
            <path
              d="M4.9 7.2a4.4 4.4 0 0 1 6.2 0"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <path
              d="M2.6 4.8a7.6 7.6 0 0 1 10.8 0"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          <svg width="25" height="12" viewBox="0 0 25 12" fill="none" aria-hidden="true">
            <rect
              x="0.75"
              y="0.75"
              width="20.5"
              height="10.5"
              rx="3"
              stroke="currentColor"
              strokeOpacity="0.6"
              strokeWidth="1"
            />
            <rect x="2.25" y="2.25" width="14" height="7.5" rx="1.8" fill="currentColor" />
            <path
              d="M22.6 4v4c1-.4 1.6-1.1 1.6-2s-.6-1.6-1.6-2Z"
              fill="currentColor"
              fillOpacity="0.6"
            />
          </svg>
          <span suppressHydrationWarning className="tabular-nums">
            {clock || "Wed Sep 17  9:41 AM"}
          </span>
        </div>
      </header>

      {/* Desktop files, for flavor */}
      <div className="absolute right-5 top-12 z-10 flex flex-col items-center gap-5">
        <div className="flex w-24 flex-col items-center gap-1">
          <span className="text-[34px] drop-shadow-lg">{"\u{1F4C4}"}</span>
          <span className="rounded px-1 text-center text-[11px] leading-tight text-white/95 [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">
            final_grade.pdf
          </span>
        </div>
        <div className="flex w-24 flex-col items-center gap-1">
          <span className="text-[34px] drop-shadow-lg">{"\u{1F592}"}</span>
          <span className="rounded px-1 text-center text-[11px] leading-tight text-white/95 [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">
            definitely_human.txt
          </span>
        </div>
      </div>

      {/* Attempt-counter toast (macOS notification style) */}
      {noAttempts > 0 && !accepted && (
        <aside
          className="fixed right-3 top-10 z-50 flex w-64 items-center gap-3 rounded-2xl border border-white/25 bg-white/25 p-3 text-white shadow-xl backdrop-blur-2xl"
          style={{ animation: "toast-in 0.3s ease" }}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/25 text-lg">
            {"⚠️"}
          </span>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold leading-tight">
              Persistence detected
            </p>
            <p className="text-[12px] leading-tight text-white/85">
              No attempts: {noAttempts}/{MAX_NO_ATTEMPTS}
            </p>
          </div>
        </aside>
      )}

      {/* Centered alert dialog */}
      <main className="absolute inset-0 flex items-center justify-center px-4 pb-28 pt-10">
        <div
          style={{
            animation:
              noAttempts > 0 ? `${shakeName} 0.45s ease` : undefined,
          }}
        >
          <div
            className="rounded-xl bg-white/95 backdrop-blur-xl"
            style={{
              width: dialogWidth,
              boxShadow:
                "0 30px 70px rgba(0,0,0,0.5), 0 2px 10px rgba(0,0,0,0.25)",
              animation: "dialog-pop 0.35s ease",
              transition: "width 320ms ease",
            }}
          >
            {/* Title bar with traffic lights */}
            <div
              className="relative flex h-7 items-center rounded-t-xl border-b border-black/10 px-2.5"
              style={{ background: "linear-gradient(180deg, #f7f7f7, #ececec)" }}
            >
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full border border-black/10 bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full border border-black/10 bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full border border-black/10 bg-[#28c840]" />
              </div>
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[12px] font-medium text-gray-500">
                Grade Request
              </span>
            </div>

            {/* Dialog body */}
            <div className="flex flex-col items-center rounded-b-xl px-6 pb-6 pt-6 text-center">
              <div className="relative mb-4 inline-block">
                <span className="block leading-none" style={{ fontSize: 60 }}>
                  {"\u{1F469}\u200D\u{1F4BB}"}
                </span>
                <span
                  className="absolute -bottom-1 -right-4 inline-block leading-none"
                  aria-hidden="true"
                >
                  <span style={{ fontSize: 24 }}>{"\u{1F916}"}</span>
                  <span
                    className="absolute"
                    style={{ fontSize: 30, left: -3, top: -4 }}
                  >
                    {"\u{1F6AB}"}
                  </span>
                </span>
              </div>

              <p className="text-[13px] text-gray-600">
                my name is Amina, i am not an ai (i think)
              </p>
              <p className="mt-1.5 text-[19px] font-bold text-gray-900">
                Will you give me an A?
              </p>

              <div className="mt-5 flex w-full flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleNo}
                  className="rounded-lg border border-gray-300 bg-white px-5 py-1.5 font-medium text-gray-700 shadow-sm hover:bg-gray-50 active:bg-gray-100"
                  style={noStyle}
                >
                  {noLabel}
                </button>
                <button
                  type="button"
                  onClick={handleYes}
                  className="rounded-lg hover:brightness-110 active:brightness-95"
                  style={yesStyle}
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Dock */}
      <nav className="absolute bottom-2 left-1/2 z-40 flex -translate-x-1/2 items-end gap-3 rounded-2xl border border-white/25 bg-white/15 px-3 pb-2 pt-2 shadow-2xl backdrop-blur-2xl">
        {DOCK_APPS.map((app) => (
          <div key={app.label} className="group relative flex flex-col items-center">
            <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/60 px-2 py-0.5 text-[11px] text-white opacity-0 backdrop-blur transition-opacity duration-150 group-hover:opacity-100">
              {app.label}
            </span>
            {app.href ? (
              <Link
                href={app.href}
                aria-label={`Open ${app.label}`}
                className="flex h-12 w-12 origin-bottom cursor-pointer items-center justify-center rounded-xl text-[26px] shadow-lg ring-1 ring-white/25 transition-all duration-200 group-hover:-translate-y-2 group-hover:scale-125"
                style={{ background: app.bg }}
              >
                {app.glyph}
              </Link>
            ) : (
              <button
                type="button"
                aria-label={app.label}
                className="flex h-12 w-12 origin-bottom cursor-default items-center justify-center rounded-xl text-[26px] shadow-lg ring-1 ring-white/25 transition-all duration-200 group-hover:-translate-y-2 group-hover:scale-125"
                style={{ background: app.bg }}
              >
                {app.glyph}
              </button>
            )}
            <span
              className={`mt-1 h-1 w-1 rounded-full bg-white/80 ${
                app.running ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>
        ))}
        <div className="mx-1 w-px self-stretch bg-white/25" />
        <div className="group relative flex flex-col items-center">
          <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/60 px-2 py-0.5 text-[11px] text-white opacity-0 backdrop-blur transition-opacity duration-150 group-hover:opacity-100">
            {TRASH_APP.label}
          </span>
          <button
            type="button"
            aria-label={TRASH_APP.label}
            className="flex h-12 w-12 origin-bottom cursor-default items-center justify-center rounded-xl text-[26px] shadow-lg ring-1 ring-white/25 transition-all duration-200 group-hover:-translate-y-2 group-hover:scale-125"
            style={{ background: TRASH_APP.bg }}
          >
            {TRASH_APP.glyph}
          </button>
          <span className="mt-1 h-1 w-1 rounded-full opacity-0" />
        </div>
      </nav>

      {/* Full-screen YES takeover after 20 refusals */}
      {yesTakeover && (
        <button
          type="button"
          onClick={handleYes}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center text-white transition hover:brightness-110"
          style={{
            background:
              "radial-gradient(120% 120% at 50% 20%, #3ea0ff 0%, #0a84ff 45%, #0050c8 100%)",
            fontFamily: FONT_STACK,
          }}
        >
          <span
            className="font-black leading-none tracking-tight"
            style={{ fontSize: "20vw", animation: "yes-pulse 1.6s ease-in-out infinite" }}
          >
            YES
          </span>
          <span className="mt-6 text-lg text-white/85 sm:text-xl">
            (there was never another option)
          </span>
          <span className="mt-2 text-sm text-white/60">
            No attempts: {MAX_NO_ATTEMPTS}/{MAX_NO_ATTEMPTS} &middot; the No button
            has been escorted off the premises
          </span>
        </button>
      )}

      {/* Success state */}
      {accepted && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center px-4"
          style={{
            background: "rgba(8,10,30,0.55)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          {confetti.map((p) => (
            <span
              key={p.id}
              aria-hidden="true"
              className="pointer-events-none fixed top-0"
              style={{
                left: `${p.left}%`,
                fontSize: p.size,
                animation: `confetti-fall ${p.duration}s linear ${p.delay}s infinite`,
              }}
            >
              {p.glyph}
            </span>
          ))}
          <div
            className="w-[440px] max-w-[94vw] rounded-xl bg-white/95 backdrop-blur-xl"
            style={{
              boxShadow:
                "0 30px 70px rgba(0,0,0,0.5), 0 2px 10px rgba(0,0,0,0.25)",
              animation: "dialog-pop 0.35s ease",
            }}
          >
            <div
              className="relative flex h-7 items-center rounded-t-xl border-b border-black/10 px-2.5"
              style={{ background: "linear-gradient(180deg, #f7f7f7, #ececec)" }}
            >
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full border border-black/10 bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full border border-black/10 bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full border border-black/10 bg-[#28c840]" />
              </div>
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[12px] font-medium text-gray-500">
                Grade Confirmed
              </span>
            </div>
            <div className="flex flex-col items-center rounded-b-xl px-6 pb-6 pt-6 text-center">
              <span className="leading-none" style={{ fontSize: 58 }}>
                {"\u{1F389}"}
              </span>
              <p className="mt-3 text-[22px] font-bold text-gray-900">
                Thank you! A+ it is.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-gray-600">
                Correct answer. Grade locked in. This action cannot be undone.
              </p>
              <p className="mt-4 border-t border-gray-200 pt-3 text-[11px] italic text-gray-400">
                certified: not an ai (i think)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

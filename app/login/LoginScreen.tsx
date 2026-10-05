"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FONT_STACK, WALLPAPER } from "@/lib/desktop-theme";
import { createClient } from "@/lib/supabase/client";

function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export default function LoginScreen({ error }: { error: string | null }) {
  const now = useNow();
  const [pending, setPending] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const shownError = clientError ?? error;

  const signIn = async () => {
    setPending(true);
    setClientError(null);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      // Exactly /auth/callback, no extra query params.
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setClientError(error.message);
      setPending(false);
    }
    // On success the browser is already navigating to Google.
  };

  const date = now?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const time = now
    ?.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    .replace(/\s?[AP]M$/, "");

  return (
    <div
      className="fixed inset-0 flex select-none flex-col items-center overflow-hidden text-white"
      style={{ fontFamily: FONT_STACK, background: WALLPAPER }}
    >
      {/* Frosted overlay, like the blurred wallpaper on the macOS lock screen */}
      <div className="pointer-events-none absolute inset-0 bg-black/15 backdrop-blur-[2px]" />

      {/* Status icons, top right */}
      <div className="absolute right-4 top-2 z-10 flex items-center gap-3 text-[13px] text-white/85">
        <span>U.S.</span>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
          <path d="M8 10.8a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6Z" fill="currentColor" />
          <path d="M4.9 7.2a4.4 4.4 0 0 1 6.2 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M2.6 4.8a7.6 7.6 0 0 1 10.8 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>

      {/* Date + big clock */}
      <div className="relative z-10 mt-[9vh] text-center [text-shadow:0_2px_12px_rgba(0,0,0,0.25)]">
        <p suppressHydrationWarning className="text-[20px] font-semibold text-white/90 sm:text-[22px]">
          {date ?? " "}
        </p>
        <p
          suppressHydrationWarning
          className="font-bold leading-none tracking-tight text-white/90 tabular-nums"
          style={{ fontSize: "clamp(72px, 16vw, 128px)" }}
        >
          {time ?? " "}
        </p>
      </div>

      {/* User + sign in */}
      <main className="relative z-10 mt-auto mb-[14vh] flex w-full max-w-xs flex-col items-center px-4 text-center">
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-b from-white/50 to-white/20 text-[52px] shadow-2xl ring-1 ring-white/40 backdrop-blur-xl">
          {"\u{1F469}‍\u{1F393}"}
        </span>
        <p className="mt-3 text-[17px] font-semibold [text-shadow:0_1px_6px_rgba(0,0,0,0.3)]">
          Will you give me an A?
        </p>
        <p className="mt-0.5 text-[12px] text-white/75">
          Sign in to see your transcript
        </p>

        <div
          key={shownError ?? "ok"}
          className="mt-4 w-full"
          style={{ animation: shownError ? "login-shake 0.4s ease" : undefined }}
        >
          <button
            type="button"
            onClick={signIn}
            disabled={pending}
            className="group flex h-9 w-full items-center gap-2.5 rounded-full border border-white/30 bg-white/25 pl-1.5 pr-1.5 text-left text-[13px] text-white shadow-lg backdrop-blur-2xl transition hover:bg-white/35 disabled:opacity-70"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white">
              <GoogleG />
            </span>
            <span className="flex-1 truncate">
              {pending ? "Opening Google…" : "Sign in with Google"}
            </span>
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/50 text-[13px] ${
                pending ? "animate-spin border-t-transparent" : "group-hover:bg-white/20"
              }`}
              aria-hidden="true"
            >
              {pending ? "" : "→"}
            </span>
          </button>
        </div>

        <p role="alert" className="mt-2 min-h-[18px] text-[12px] text-white/90">
          {shownError ? `Sign-in failed: ${shownError}` : ""}
        </p>
      </main>

      {/* Bottom control, like the lock screen's Guest User button */}
      <nav className="relative z-10 mb-8 flex items-start text-[12px] text-white/85">
        <Link href="/" className="group flex flex-col items-center gap-1.5">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-[18px] backdrop-blur-xl ring-1 ring-white/25 group-hover:bg-white/30">
            {"\u{1F464}"}
          </span>
          Guest User
        </Link>
      </nav>
    </div>
  );
}

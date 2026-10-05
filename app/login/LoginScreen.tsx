"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import Avatar from "@/components/Avatar";
import { FONT_STACK, WALLPAPER } from "@/lib/desktop-theme";
import { MIN_PASSWORD } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/client";
import {
  continueAsGuest,
  continueAsUser,
  createAccount,
  signInWithPassword,
  type LoginState,
} from "./actions";

const INITIAL: LoginState = { error: null, notice: null };

type LockUser = { greeting: string; name: string; avatar: string | null };

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
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

// The translucent rounded field from the macOS login window.
const pillInput =
  "glass-input h-8 w-full rounded-full border border-white/30 bg-white/20 px-3.5 text-[13px] text-white shadow-inner outline-none backdrop-blur-2xl placeholder:text-white/60 focus:border-white/60 focus:bg-white/25";

function ArrowButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={label}
      className={`absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full border border-white/50 text-[13px] text-white hover:bg-white/20 disabled:opacity-70 ${
        pending ? "animate-spin border-t-transparent" : ""
      }`}
    >
      {pending ? "" : "→"}
    </button>
  );
}

function BottomButton({ glyph, label, ...props }: { glyph: string; label: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className="group flex flex-col items-center gap-1.5 text-[12px] text-white/85">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-[18px] ring-1 ring-white/25 backdrop-blur-xl group-hover:bg-white/30">
        {glyph}
      </span>
      {label}
    </button>
  );
}

function Shake({ trigger, children }: { trigger: string | null; children: ReactNode }) {
  return (
    <div key={trigger ?? "ok"} className="w-full" style={{ animation: trigger ? "login-shake 0.4s ease" : undefined }}>
      {children}
    </div>
  );
}

export default function LoginScreen({
  user,
  googleEnabled,
  error,
}: {
  user: LockUser | null;
  googleEnabled: boolean;
  error: string | null;
}) {
  const now = useNow();
  const [mode, setMode] = useState<"signin" | "create">("signin");

  const date = now?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const time = now
    ?.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    .replace(/\s?[AP]M$/, "");

  return (
    <div
      className="fixed inset-0 flex select-none flex-col items-center overflow-y-auto overflow-x-hidden text-white"
      style={{ fontFamily: FONT_STACK, background: WALLPAPER }}
    >
      {/* Frosted overlay, like the blurred wallpaper on the macOS lock screen */}
      <div className="pointer-events-none fixed inset-0 bg-black/15 backdrop-blur-[2px]" />

      <div className="absolute right-4 top-2 z-10 flex items-center gap-3 text-[13px] text-white/85">
        <span>U.S.</span>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
          <path d="M8 10.8a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6Z" fill="currentColor" />
          <path d="M4.9 7.2a4.4 4.4 0 0 1 6.2 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M2.6 4.8a7.6 7.6 0 0 1 10.8 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>

      {/* Date + big clock */}
      <div className="relative z-10 mt-[8vh] shrink-0 text-center [text-shadow:0_2px_12px_rgba(0,0,0,0.25)]">
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

      <main className="relative z-10 mt-auto flex w-full max-w-[290px] shrink-0 flex-col items-center px-4 pt-8 text-center">
        {user ? (
          <SignedIn user={user} />
        ) : mode === "signin" ? (
          <SignIn initialError={error} googleEnabled={googleEnabled} onCreate={() => setMode("create")} />
        ) : (
          <CreateAccount onCancel={() => setMode("signin")} />
        )}
      </main>

      {/* Bottom controls */}
      <nav className="relative z-10 mb-8 mt-10 flex shrink-0 items-start gap-10">
        {user ? (
          <form action="/auth/signout" method="post">
            <BottomButton type="submit" glyph={"⏻"} label="Log Out" />
          </form>
        ) : (
          <form action={continueAsGuest}>
            <BottomButton type="submit" glyph={"\u{1F464}"} label="Guest User" />
          </form>
        )}
      </nav>
    </div>
  );
}

function Greeting({ avatar, name, title }: { avatar: string | null; name: string; title: string }) {
  return (
    <>
      {avatar ? (
        <Avatar src={avatar} name={name} size={96} className="shadow-2xl ring-1 ring-white/40" />
      ) : (
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-b from-white/50 to-white/20 shadow-2xl ring-1 ring-white/40 backdrop-blur-xl">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="white" fillOpacity="0.9" aria-hidden="true">
            <circle cx="12" cy="8.5" r="4" />
            <path d="M4 20.5c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5z" />
          </svg>
        </span>
      )}
      <p className="mt-3 text-[20px] font-semibold [text-shadow:0_1px_6px_rgba(0,0,0,0.3)]">{title}</p>
    </>
  );
}

function SignedIn({ user }: { user: LockUser }) {
  const [, action, pending] = useActionState(async () => {
    await continueAsUser();
  }, undefined);
  return (
    <>
      <Greeting avatar={user.avatar} name={user.name} title={`Hello, ${user.greeting}`} />
      <p className="mt-0.5 text-[12px] text-white/75">{user.name}</p>
      <form action={action} className="mt-4 w-full">
        <button
          type="submit"
          disabled={pending}
          className="group relative h-8 w-full rounded-full border border-white/30 bg-white/25 text-[13px] shadow-lg backdrop-blur-2xl hover:bg-white/35 disabled:opacity-70"
        >
          {pending ? "Unlocking…" : "Continue"}
          <span className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full border border-white/50">
            →
          </span>
        </button>
      </form>
    </>
  );
}

function SignIn({
  initialError,
  googleEnabled,
  onCreate,
}: {
  initialError: string | null;
  googleEnabled: boolean;
  onCreate: () => void;
}) {
  const [state, action, pending] = useActionState(signInWithPassword, INITIAL);
  const [googlePending, setGooglePending] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const error = state.error ?? googleError ?? (initialError ? `Sign-in failed: ${initialError}` : null);

  const google = async () => {
    setGoogleError(null);
    if (!googleEnabled) {
      setGoogleError("Google sign-in isn't switched on for this site yet. Use your email and password, or create an account.");
      return;
    }
    setGooglePending(true);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      // Exactly /auth/callback, no extra query params.
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setGoogleError(error.message);
      setGooglePending(false);
    }
  };

  return (
    <>
      <Greeting avatar={null} name="stranger" title="Hello, stranger" />
      <form action={action} className="mt-4 flex w-full flex-col gap-2">
        <Shake trigger={state.error}>
          <div className="flex flex-col gap-2">
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="Email"
              aria-label="Email"
              className={pillInput}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !passwordRef.current?.value) {
                  e.preventDefault();
                  passwordRef.current?.focus();
                }
              }}
            />
            <div className="relative">
              <input
                ref={passwordRef}
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="Enter Password"
                aria-label="Password"
                className={`${pillInput} pr-9`}
              />
              <ArrowButton pending={pending} label="Log in" />
            </div>
          </div>
        </Shake>
      </form>

      <p role="alert" className="mt-2 min-h-[18px] text-[12px] text-white/90">
        {error}
      </p>

      <button
        type="button"
        onClick={onCreate}
        className="flex h-8 w-full items-center justify-center rounded-full border border-white/30 bg-white/20 text-[13px] font-medium text-white shadow-lg backdrop-blur-2xl hover:bg-white/30"
      >
        Create Account
      </button>

      <div className="mt-4 flex w-full items-center gap-2 text-[11px] text-white/60">
        <span className="h-px flex-1 bg-white/25" /> or <span className="h-px flex-1 bg-white/25" />
      </div>

      <button
        type="button"
        onClick={google}
        disabled={googlePending}
        className="mt-3 flex h-8 w-full items-center justify-center gap-2 rounded-full border border-white/30 bg-white/90 text-[13px] font-medium text-gray-800 shadow-lg hover:bg-white disabled:opacity-70"
      >
        <GoogleG />
        {googlePending ? "Opening Google…" : "Sign in with Google"}
      </button>
    </>
  );
}

function CreateAccount({ onCancel }: { onCancel: () => void }) {
  const [state, action, pending] = useActionState(createAccount, INITIAL);

  if (state.notice) {
    return (
      <>
        <Greeting avatar={null} name="stranger" title="Check your email" />
        <p className="mt-2 text-[13px] leading-relaxed text-white/85">{state.notice}</p>
        <button type="button" onClick={onCancel} className="mt-4 text-[12px] text-white/85 hover:underline">
          Back to Log In
        </button>
      </>
    );
  }

  return (
    <>
      <p className="text-[20px] font-semibold [text-shadow:0_1px_6px_rgba(0,0,0,0.3)]">Create Account</p>
      <p className="mt-0.5 text-[12px] text-white/75">Join the class. Grades not included.</p>
      <form action={action} className="mt-4 w-full">
        <Shake trigger={state.error}>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input name="first_name" required maxLength={60} autoComplete="given-name" placeholder="First name" aria-label="First name" className={pillInput} />
              <input name="last_name" required maxLength={60} autoComplete="family-name" placeholder="Last name" aria-label="Last name" className={pillInput} />
            </div>
            <input name="email" type="email" required autoComplete="email" placeholder="Email" aria-label="Email" className={pillInput} />
            <input name="password" type="password" required minLength={MIN_PASSWORD} autoComplete="new-password" placeholder={`Password (${MIN_PASSWORD}+ characters)`} aria-label="Password" className={pillInput} />
            <input name="verify" type="password" required minLength={MIN_PASSWORD} autoComplete="new-password" placeholder="Verify password" aria-label="Verify password" className={pillInput} />
          </div>
        </Shake>
        <button
          type="submit"
          disabled={pending}
          className="mt-3 flex h-8 w-full items-center justify-center rounded-full bg-white/90 text-[13px] font-semibold text-gray-900 shadow-lg hover:bg-white disabled:opacity-70"
        >
          {pending ? "Creating Account…" : "Sign Up"}
        </button>
      </form>
      <p role="alert" className="mt-2 min-h-[18px] text-[12px] text-white/90">
        {state.error}
      </p>
      <button type="button" onClick={onCancel} className="mt-1 text-[12px] text-white/85 hover:text-white hover:underline">
        Cancel
      </button>
    </>
  );
}

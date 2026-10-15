"use client";

import { Check, Flame, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Avatar from "@/components/Avatar";
import {
  checkUsername,
  cookedLogIn,
  cookedSignUp,
  createCookedProfile,
  updateCookedProfile,
  type MyCookedAccount,
  type UsernameCheck,
} from "@/app/actions/cooked-account";
import { normaliseUsername } from "@/lib/cooked";
import { rememberReturnTo } from "@/lib/return-to";
import { avatarUrl, MIN_PASSWORD } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/client";
import type { AuthMode } from "./account";
import { focusRing } from "./shared";

const field =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-[14px] text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-orange-500 focus:ring-[3px] focus:ring-orange-200";
const primary = `flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-orange-700 active:translate-y-px disabled:opacity-60 ${focusRing}`;

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

// Live "@name is available" check while typing.
function useUsernameCheck(username: string) {
  const [result, setResult] = useState<UsernameCheck | null>(null);
  useEffect(() => {
    const name = normaliseUsername(username);
    if (!name) return;
    let cancelled = false;
    const t = window.setTimeout(() => {
      checkUsername(name).then((r) => {
        if (!cancelled) setResult(r);
      });
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [username]);
  return username ? result : null;
}

function UsernameField({ value, onChange, autoFocus }: { value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  const check = useUsernameCheck(value);
  return (
    <div>
      <label htmlFor="cooked-username" className="text-[13px] font-semibold text-stone-800">
        Username
      </label>
      <div className="relative mt-1">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-stone-400">@</span>
        <input
          id="cooked-username"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/^@/, "").toLowerCase().replace(/[^a-z0-9_]/g, ""))}
          maxLength={20}
          autoFocus={autoFocus}
          autoCapitalize="off"
          autoComplete="username"
          spellCheck={false}
          placeholder="slicecritic"
          className={`${field} pl-7`}
          aria-describedby="cooked-username-help"
        />
      </div>
      <p id="cooked-username-help" className={`mt-1 text-[12px] ${check ? (check.ok ? "text-green-700" : "text-red-600") : "text-stone-500"}`}>
        {check ? check.message : "3–20 characters: lowercase letters, numbers and _. Shown on your posts."}
      </p>
    </div>
  );
}

function Shell({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="absolute inset-0 z-30 flex items-start justify-center overflow-y-auto bg-stone-900/45 px-4 py-8 backdrop-blur-[2px]" onPointerDown={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cooked-auth-title"
        onPointerDown={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl bg-[#fbf7f2] p-6 shadow-2xl ring-1 ring-stone-200"
        style={{ animation: "dialog-pop 0.22s ease" }}
      >
        <button type="button" onClick={onClose} aria-label="Close" className={`absolute right-3 top-3 rounded-lg p-1.5 text-stone-500 hover:bg-stone-200/70 ${focusRing}`}>
          <X className="h-4 w-4" />
        </button>
        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-orange-700">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-orange-600 text-white">
            <Flame className="h-3 w-3" />
          </span>
          cooked.ai
        </p>
        <h2 id="cooked-auth-title" className="mt-2 text-[22px] font-extrabold tracking-[-0.01em] text-stone-900">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-[13.5px] text-stone-600">{subtitle}</p>}
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function GoogleButton() {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        rememberReturnTo("/safari/cooked.ai");
        await createClient().auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: `${window.location.origin}/auth/callback`, queryParams: { prompt: "select_account" } },
        });
      }}
      className={`flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[14px] font-semibold text-stone-800 shadow-sm ring-1 ring-stone-300 transition hover:bg-stone-50 disabled:opacity-60 ${focusRing}`}
    >
      <GoogleG /> {pending ? "Opening Google…" : "Continue with Google"}
    </button>
  );
}

function Divider() {
  return (
    <div className="my-4 flex items-center gap-3 text-[12px] text-stone-400">
      <span className="h-px flex-1 bg-stone-300" /> or with email <span className="h-px flex-1 bg-stone-300" />
    </div>
  );
}

function ErrorText({ error }: { error: string | null }) {
  return error ? (
    <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">
      {error}
    </p>
  ) : null;
}

export default function AuthPanel({
  mode,
  me,
  onMode,
  onClose,
  onChanged,
}: {
  mode: AuthMode;
  me: MyCookedAccount | null;
  onMode: (m: AuthMode) => void;
  onClose: () => void;
  onChanged: () => void; // reload the cooked.ai account
}) {
  if (mode === "signup") return <SignUp onMode={onMode} onClose={onClose} onChanged={onChanged} />;
  if (mode === "login") return <LogIn onMode={onMode} onClose={onClose} onChanged={onChanged} />;
  if (mode === "profile") return <CreateProfile me={me} onClose={onClose} onChanged={onChanged} />;
  return <EditProfile me={me} onClose={onClose} onChanged={onChanged} />;
}

function SignUp({ onMode, onClose, onChanged }: { onMode: (m: AuthMode) => void; onClose: () => void; onChanged: () => void }) {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  if (confirmSent) {
    return (
      <Shell title="Check your email" onClose={onClose}>
        <p className="text-[14px] leading-relaxed text-stone-700">
          We sent a confirmation link to <strong>{email}</strong>. Open it on this device and you’ll come right back here, signed in as{" "}
          <strong>@{username}</strong>.
        </p>
        <button type="button" onClick={onClose} className={`${primary} mt-5`}>
          Got it
        </button>
      </Shell>
    );
  }

  return (
    <Shell title="Create your account" subtitle="Post pics, vote on captions, and get your own @username." onClose={onClose}>
      <GoogleButton />
      <Divider />
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          setError(null);
          rememberReturnTo("/safari/cooked.ai");
          const res = await cookedSignUp({ firstName: first, lastName: last, username, email, password });
          setPending(false);
          if (!res.ok) return setError(res.error);
          if (res.needsConfirmation) return setConfirmSent(true);
          onChanged();
          onClose();
        }}
      >
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="su-first" className="text-[13px] font-semibold text-stone-800">
              First name
            </label>
            <input id="su-first" value={first} onChange={(e) => setFirst(e.target.value)} required maxLength={60} autoComplete="given-name" className={`${field} mt-1`} />
          </div>
          <div>
            <label htmlFor="su-last" className="text-[13px] font-semibold text-stone-800">
              Last name
            </label>
            <input id="su-last" value={last} onChange={(e) => setLast(e.target.value)} required maxLength={60} autoComplete="family-name" className={`${field} mt-1`} />
          </div>
        </div>
        <UsernameField value={username} onChange={setUsername} />
        <div>
          <label htmlFor="su-email" className="text-[13px] font-semibold text-stone-800">
            Email
          </label>
          <input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={`${field} mt-1`} />
        </div>
        <div>
          <label htmlFor="su-password" className="text-[13px] font-semibold text-stone-800">
            Password
          </label>
          <input
            id="su-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={MIN_PASSWORD}
            autoComplete="new-password"
            className={`${field} mt-1`}
          />
          <p className="mt-1 text-[12px] text-stone-500">At least {MIN_PASSWORD} characters.</p>
        </div>
        <ErrorText error={error} />
        <button type="submit" disabled={pending} className={primary}>
          {pending ? "Creating your account…" : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-center text-[13px] text-stone-600">
        Already have an account?{" "}
        <button type="button" onClick={() => onMode("login")} className={`rounded font-semibold text-orange-700 underline-offset-4 hover:underline ${focusRing}`}>
          Log in
        </button>
      </p>
      <p className="mt-3 text-center text-[11.5px] leading-relaxed text-stone-500">
        One account works everywhere on this Mac, including Terminal Academy. Your cooked.ai profile is public.
      </p>
    </Shell>
  );
}

function LogIn({ onMode, onClose, onChanged }: { onMode: (m: AuthMode) => void; onClose: () => void; onChanged: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Shell title="Welcome back" subtitle="Log in to post and vote." onClose={onClose}>
      <GoogleButton />
      <Divider />
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          setError(null);
          const res = await cookedLogIn({ email, password });
          setPending(false);
          if (!res.ok) return setError(res.error);
          onChanged();
          onClose();
        }}
      >
        <div>
          <label htmlFor="li-email" className="text-[13px] font-semibold text-stone-800">
            Email
          </label>
          <input id="li-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" autoFocus className={`${field} mt-1`} />
        </div>
        <div>
          <label htmlFor="li-password" className="text-[13px] font-semibold text-stone-800">
            Password
          </label>
          <input id="li-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className={`${field} mt-1`} />
        </div>
        <ErrorText error={error} />
        <button type="submit" disabled={pending} className={primary}>
          {pending ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="mt-4 text-center text-[13px] text-stone-600">
        New here?{" "}
        <button type="button" onClick={() => onMode("signup")} className={`rounded font-semibold text-orange-700 underline-offset-4 hover:underline ${focusRing}`}>
          Create an account
        </button>
      </p>
    </Shell>
  );
}

function CreateProfile({ me, onClose, onChanged }: { me: MyCookedAccount | null; onClose: () => void; onChanged: () => void }) {
  const [username, setUsername] = useState(me?.suggestedUsername ?? "");
  const [name, setName] = useState(me?.suggestedName ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Shell title="Create your cooked.ai profile" subtitle="Pick how you show up on your posts. You can change it later." onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          setError(null);
          const res = await createCookedProfile(username, name);
          setPending(false);
          if (!res.ok) return setError(res.error);
          onChanged();
          onClose();
        }}
      >
        <UsernameField value={username} onChange={setUsername} autoFocus />
        <div>
          <label htmlFor="cp-name" className="text-[13px] font-semibold text-stone-800">
            Display name
          </label>
          <input id="cp-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={40} className={`${field} mt-1`} />
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-stone-200">
          <Avatar src={null} name={name || username || "?"} size={36} />
          <div className="min-w-0 text-[13px]">
            <p className="truncate font-semibold text-stone-900">{name || "Your name"}</p>
            <p className="truncate text-stone-500">@{normaliseUsername(username) || "username"}</p>
          </div>
          <span className="ml-auto text-[11px] text-stone-400">Preview</span>
        </div>
        <ErrorText error={error} />
        <button type="submit" disabled={pending} className={primary}>
          {pending ? "Saving…" : (
            <>
              <Check className="h-4 w-4" /> Create profile
            </>
          )}
        </button>
      </form>
    </Shell>
  );
}

function EditProfile({ me, onClose, onChanged }: { me: MyCookedAccount | null; onClose: () => void; onChanged: () => void }) {
  const router = useRouter();
  const profile = me?.profile;
  const [username, setUsername] = useState(profile?.username ?? "");
  const [name, setName] = useState(profile?.display_name ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  if (!profile) return null;
  const shown = preview ?? (removed ? null : avatarUrl(profile.avatar_path));

  return (
    <Shell title="Your profile" subtitle="This is how you appear on cooked.ai." onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          setError(null);
          const data = new FormData();
          data.set("username", username);
          data.set("display_name", name);
          if (file) data.set("avatar", file);
          if (removed) data.set("remove_avatar", "1");
          const res = await updateCookedProfile(data);
          setPending(false);
          if (!res.ok) return setError(res.error);
          onChanged();
          onClose();
        }}
      >
        <div className="flex items-center gap-3">
          <Avatar src={shown} name={name || username} size={56} />
          <div className="flex flex-wrap gap-2 text-[13px]">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > 2 * 1024 * 1024) return setError("That image is over 2 MB.");
                setFile(f);
                setPreview(URL.createObjectURL(f));
                setRemoved(false);
              }}
            />
            <button type="button" onClick={() => fileRef.current?.click()} className={`rounded-lg bg-white px-3 py-1.5 font-semibold text-stone-800 ring-1 ring-stone-300 hover:bg-stone-50 ${focusRing}`}>
              {shown ? "Change photo" : "Add photo"}
            </button>
            {shown && (
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  setRemoved(true);
                }}
                className={`rounded font-medium text-stone-500 hover:text-stone-800 ${focusRing}`}
              >
                Remove
              </button>
            )}
          </div>
        </div>
        <UsernameField value={username} onChange={setUsername} />
        <div>
          <label htmlFor="ep-name" className="text-[13px] font-semibold text-stone-800">
            Display name
          </label>
          <input id="ep-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={40} className={`${field} mt-1`} />
        </div>
        <ErrorText error={error} />
        <button type="submit" disabled={pending} className={primary}>
          {pending ? "Saving…" : "Save profile"}
        </button>
      </form>
      <div className="mt-5 flex items-center justify-between border-t border-stone-200 pt-4 text-[13px]">
        <span className="text-stone-500">Signed in to this Mac and cooked.ai</span>
        <button
          type="button"
          onClick={async () => {
            await createClient().auth.signOut();
            onClose();
            onChanged();
            router.refresh();
          }}
          className={`rounded font-semibold text-red-700 underline-offset-4 hover:underline ${focusRing}`}
        >
          Log out
        </button>
      </div>
    </Shell>
  );
}

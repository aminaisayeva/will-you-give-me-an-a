"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cookedSignUp } from "@/app/actions/cooked-account";
import { Divider, ErrorText, field, GoogleButton, primary, UsernameField } from "@/components/safari/cooked/AuthPanel";
import { focusRing } from "@/components/safari/cooked/shared";
import { rememberReturnTo } from "@/lib/return-to";
import { MIN_PASSWORD } from "@/lib/supabase";

export default function SignupForm() {
  const router = useRouter();
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
      <div className="text-[15px] leading-relaxed text-stone-700">
        <p>
          We sent a confirmation link to <strong>{email}</strong>. Open it on this device and you’ll land on your feed as <strong>@{username}</strong>.
        </p>
        <p className="mt-3 text-[13px] text-stone-500">Can’t find it? Check your spam folder, or sign up with Google instead.</p>
      </div>
    );
  }

  return (
    <>
      <GoogleButton returnTo="/feed" />
      <Divider />
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          setError(null);
          rememberReturnTo("/feed");
          const res = await cookedSignUp({ firstName: first, lastName: last, username, email, password });
          if (!res.ok) {
            setPending(false);
            return setError(res.error);
          }
          if (res.needsConfirmation) return setConfirmSent(true);
          router.push("/feed");
          router.refresh();
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
          <input id="su-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={MIN_PASSWORD} autoComplete="new-password" className={`${field} mt-1`} />
          <p className="mt-1 text-[12px] text-stone-500">At least {MIN_PASSWORD} characters.</p>
        </div>
        <ErrorText error={error} />
        <button type="submit" disabled={pending} className={primary}>
          {pending ? "Creating your account…" : "Create account"}
        </button>
      </form>
      <p className="mt-5 text-center text-[14px] text-stone-600">
        Already have an account?{" "}
        <Link href="/login" className={`rounded font-semibold text-orange-700 underline-offset-4 hover:underline ${focusRing}`}>
          Log in
        </Link>
      </p>
      <p className="mt-3 text-center text-[12px] text-stone-500">Your profile and posts are public on cooked.ai.</p>
    </>
  );
}

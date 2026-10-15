"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cookedLogIn } from "@/app/actions/cooked-account";
import { Divider, ErrorText, field, GoogleButton, primary } from "@/components/safari/cooked/AuthPanel";
import { focusRing } from "@/components/safari/cooked/shared";

export default function LoginForm({ initialError }: { initialError: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

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
          const res = await cookedLogIn({ email, password });
          if (!res.ok) {
            setPending(false);
            return setError(res.error);
          }
          // /onboarding sends finished profiles on to the feed.
          router.push("/onboarding");
          router.refresh();
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
      <p className="mt-5 text-center text-[14px] text-stone-600">
        New to cooked.ai?{" "}
        <Link href="/signup" className={`rounded font-semibold text-orange-700 underline-offset-4 hover:underline ${focusRing}`}>
          Create an account
        </Link>
      </p>
    </>
  );
}

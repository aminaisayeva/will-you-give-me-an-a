"use client";

import { useActionState } from "react";
import MacWindow from "@/components/MacWindow";
import { FONT_STACK, WALLPAPER } from "@/lib/desktop-theme";
import { completeSetup, type FormState } from "@/app/actions/settings";

const INITIAL: FormState = { ok: false, error: null, savedAt: 0 };

export default function SetupAssistant({
  email,
  firstName,
  lastName,
}: {
  email: string;
  firstName: string;
  lastName: string;
}) {
  const [state, action, pending] = useActionState(completeSetup, INITIAL);
  const inputClass =
    "w-full rounded-md border border-black/15 bg-white px-2.5 py-1.5 text-[13px] text-gray-900 shadow-sm outline-none focus:border-[#007aff] focus:ring-[3px] focus:ring-[#007aff]/30";

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-y-auto px-4 py-8"
      style={{ fontFamily: FONT_STACK, background: WALLPAPER }}
    >
      <MacWindow title="Setup Assistant" className="w-full max-w-[560px]">
        <form action={action} className="flex flex-col px-8 pb-6 pt-8 sm:px-12">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-b from-[#67d1ff] to-[#1d6ff2] text-[34px] shadow-lg">
              {"\u{1F464}"}
            </span>
            <h1 className="mt-4 text-[22px] font-bold text-gray-900">Create Your Profile</h1>
            <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-gray-500">
              Your professor needs to know whose A this is. Fill in your name to
              finish setting up <span className="font-medium text-gray-700">{email}</span>.
            </p>
          </div>

          <div className="mx-auto mt-7 grid w-full max-w-sm grid-cols-[auto_1fr] items-center gap-x-3 gap-y-3">
            <label htmlFor="first_name" className="text-right text-[13px] text-gray-600">
              First name:
            </label>
            <input
              id="first_name"
              name="first_name"
              required
              maxLength={60}
              autoComplete="given-name"
              defaultValue={firstName}
              autoFocus
              className={inputClass}
            />
            <label htmlFor="last_name" className="text-right text-[13px] text-gray-600">
              Last name:
            </label>
            <input
              id="last_name"
              name="last_name"
              required
              maxLength={60}
              autoComplete="family-name"
              defaultValue={lastName}
              className={inputClass}
            />
          </div>

          <p role="alert" className="mt-3 min-h-[18px] text-center text-[12px] text-red-600">
            {state.error}
          </p>

          <div className="mt-5 flex items-center justify-between border-t border-black/10 pt-4">
            <span className="text-[11px] text-gray-400">You can change this later in System Settings.</span>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-[#007aff] px-5 py-1.5 text-[13px] font-medium text-white shadow-sm hover:brightness-110 disabled:opacity-60"
            >
              {pending ? "Saving…" : "Continue"}
            </button>
          </div>
        </form>
      </MacWindow>
    </div>
  );
}

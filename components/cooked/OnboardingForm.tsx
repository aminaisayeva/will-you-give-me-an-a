"use client";

import { Camera } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import { completeOnboarding, type OnboardingState } from "@/app/actions/cooked-account";
import { ErrorText, field, primary, UsernameField } from "@/components/safari/cooked/AuthPanel";
import { focusRing } from "@/components/safari/cooked/shared";

export default function OnboardingForm({
  firstName,
  lastName,
  username,
  email,
}: {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(completeOnboarding, { error: null });
  const [first, setFirst] = useState(firstName);
  const [last, setLast] = useState(lastName);
  const [name, setName] = useState(username);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // A full page load, so the header and everything else pick up the new profile.
  useEffect(() => {
    if (state.next) window.location.assign(state.next);
  }, [state.next]);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  return (
    <form action={action} className="space-y-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={`group relative rounded-full ${focusRing}`}
          aria-label="Add a profile photo"
        >
          <Avatar src={preview} name={`${first} ${last}`.trim() || name || "?"} size={64} />
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-stone-700 shadow ring-1 ring-stone-200 group-hover:bg-stone-50">
            <Camera className="h-3.5 w-3.5" />
          </span>
        </button>
        <div className="text-[13px] text-stone-600">
          <p className="font-semibold text-stone-800">Profile photo</p>
          <p>Optional. Shows next to your posts.</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          name="avatar"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            const f = e.target.files?.[0];
            setFileError(null);
            if (!f) return setPreview(null);
            if (f.size > 2 * 1024 * 1024) {
              e.target.value = "";
              return setFileError("That photo is over 2 MB. Pick a smaller one.");
            }
            setPreview(URL.createObjectURL(f));
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="ob-first" className="text-[13px] font-semibold text-stone-800">
            First name
          </label>
          <input id="ob-first" name="first_name" value={first} onChange={(e) => setFirst(e.target.value)} required maxLength={60} autoComplete="given-name" className={`${field} mt-1`} />
        </div>
        <div>
          <label htmlFor="ob-last" className="text-[13px] font-semibold text-stone-800">
            Last name
          </label>
          <input id="ob-last" name="last_name" value={last} onChange={(e) => setLast(e.target.value)} required maxLength={60} autoComplete="family-name" className={`${field} mt-1`} />
        </div>
      </div>

      <UsernameField value={name} onChange={setName} />
      <input type="hidden" name="username" value={name} />

      <p className="text-[12.5px] text-stone-500">Signed in as {email}. Your name and @username are shown on your posts.</p>
      <ErrorText error={fileError ?? state.error} />
      <button type="submit" disabled={pending || Boolean(state.next)} className={primary}>
        {pending || state.next ? "Saving…" : "Start posting"}
      </button>
    </form>
  );
}

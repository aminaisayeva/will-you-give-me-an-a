"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import MacWindow from "@/components/MacWindow";
import MenuBar, { type MenuAccount } from "@/components/MenuBar";
import { FONT_STACK, WALLPAPER } from "@/lib/desktop-theme";
import { MAX_AVATAR_BYTES } from "@/lib/supabase";
import { updateProfile, type ProfileState } from "./actions";

const INITIAL: ProfileState = { ok: false, error: null, savedAt: 0 };

export default function ProfileSettings({
  menuAccount,
  email,
  firstName,
  lastName,
  avatar,
  googleAvatar,
  memberSince,
}: {
  menuAccount: MenuAccount | null;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  googleAvatar: string | null;
  memberSince: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const [state, action, pending] = useActionState(
    async (prev: ProfileState, formData: FormData) => {
      const result = await updateProfile(prev, formData);
      // After a successful save the server data is fresh; drop local edits.
      if (result.ok) {
        setPreview(null);
        setRemoved(false);
      }
      return result;
    },
    INITIAL,
  );

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    if (!file) return setPreview(null);
    if (file.size > MAX_AVATAR_BYTES) {
      e.target.value = "";
      setPreview(null);
      return setFileError("That photo is over 4 MB. Please pick a smaller one.");
    }
    setPreview(URL.createObjectURL(file));
    setRemoved(false);
  };

  const fullName = [firstName, lastName].filter(Boolean).join(" ") || email;
  const shownAvatar = preview ?? (removed ? null : avatar ?? googleAvatar);
  const hasCustomPhoto = Boolean(preview || (avatar && !removed));
  const error = fileError ?? state.error;

  const inputClass =
    "w-full rounded-md border border-black/15 bg-white px-2.5 py-1.5 text-[13px] text-gray-900 shadow-sm outline-none focus:border-[#007aff] focus:ring-[3px] focus:ring-[#007aff]/30";

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ fontFamily: FONT_STACK, background: WALLPAPER }}
    >
      <MenuBar appName="System Settings" account={menuAccount}>
        <Link href="/" className="hover:text-white">
          ← Desktop
        </Link>
      </MenuBar>

      <main className="absolute inset-0 flex items-start justify-center overflow-y-auto px-3 pb-6 pt-12 sm:items-center">
        <MacWindow title="Profile" closeHref="/" className="flex w-full max-w-[760px] flex-col">
          <div className="flex min-h-[460px] flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="flex shrink-0 flex-col gap-1 border-b border-black/10 bg-[#f1f0f5]/90 p-3 md:w-56 md:border-b-0 md:border-r">
              <div className="mb-2 flex items-center gap-2.5 rounded-lg px-2 py-2">
                <Avatar src={avatar ?? googleAvatar} name={fullName} size={36} />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-gray-900">{fullName}</p>
                  <p className="truncate text-[11px] text-gray-500">Student Account</p>
                </div>
              </div>
              <span className="flex items-center gap-2 rounded-md bg-[#007aff] px-2 py-1.5 text-[13px] text-white">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/25 text-[11px]">{"\u{1F464}"}</span>
                Profile
              </span>
              <Link
                href="/transcript"
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-gray-800 hover:bg-black/5"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-b from-[#ff8a65] to-[#e64a19] text-[11px]">{"\u{1F4C4}"}</span>
                Transcript
              </Link>
              <form action="/auth/signout" method="post" className="mt-auto pt-3">
                <button
                  type="submit"
                  className="w-full rounded-md border border-black/10 bg-white px-2 py-1 text-[12px] text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Log Out…
                </button>
              </form>
            </aside>

            {/* Detail pane */}
            <form action={action} className="flex min-w-0 flex-1 flex-col p-5 sm:p-7">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <Avatar src={shownAvatar} name={fullName} size={96} className="shadow-lg ring-4 ring-white" />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white text-[14px] shadow-md hover:bg-gray-50"
                    aria-label="Choose a new photo"
                    title="Choose a new photo"
                  >
                    {"\u{1F4F7}"}
                  </button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  name="avatar"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={onPick}
                  className="sr-only"
                  tabIndex={-1}
                />
                <input type="hidden" name="remove_avatar" value={removed ? "1" : "0"} />
                <p className="mt-3 text-[18px] font-bold text-gray-900">{fullName}</p>
                <p className="text-[12px] text-gray-500">{email}</p>
                <div className="mt-2 flex gap-2 text-[12px]">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="text-[#007aff] hover:underline"
                  >
                    {hasCustomPhoto ? "Change Photo…" : "Upload Photo…"}
                  </button>
                  {hasCustomPhoto && (
                    <button
                      type="button"
                      onClick={() => {
                        setPreview(null);
                        setRemoved(true);
                        if (fileRef.current) fileRef.current.value = "";
                      }}
                      className="text-gray-500 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-lg border border-black/10 bg-[#f6f6f8]">
                <Row label="First name">
                  <input name="first_name" required maxLength={60} autoComplete="given-name" defaultValue={firstName} className={inputClass} />
                </Row>
                <Row label="Last name">
                  <input name="last_name" required maxLength={60} autoComplete="family-name" defaultValue={lastName} className={inputClass} />
                </Row>
                <Row label="Email">
                  <span className="truncate text-[13px] text-gray-500">{email}</span>
                </Row>
                <Row label="Member since" last>
                  <span className="text-[13px] text-gray-500">
                    {new Date(memberSince).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                </Row>
              </div>

              <div className="mt-auto flex items-center justify-end gap-3 pt-5">
                <p role="status" className={`mr-auto text-[12px] ${error ? "text-red-600" : "text-green-700"}`}>
                  {error ?? (state.ok ? "✓ Saved" : "")}
                </p>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-md bg-[#007aff] px-5 py-1.5 text-[13px] font-medium text-white shadow-sm hover:brightness-110 disabled:opacity-60"
                >
                  {pending ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </MacWindow>
      </main>
    </div>
  );
}

function Row({ label, last, children }: { label: string; last?: boolean; children: React.ReactNode }) {
  return (
    <label className={`flex items-center gap-3 px-3 py-2 ${last ? "" : "border-b border-black/5"}`}>
      <span className="w-28 shrink-0 text-[13px] text-gray-700">{label}</span>
      <span className="flex min-w-0 flex-1 justify-end">{children}</span>
    </label>
  );
}

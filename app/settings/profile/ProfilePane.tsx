"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import { MAX_AVATAR_BYTES } from "@/lib/supabase";
import { updatePhoto, type FormState } from "../actions";
import { Group, primaryButton, pushButton, Row, Status } from "../ui";

const INITIAL: FormState = { ok: false, error: null, savedAt: 0 };

export default function ProfilePane({
  name,
  email,
  photo,
  googlePhoto,
  memberSince,
  hasPassword,
}: {
  name: string;
  email: string;
  photo: string | null;
  googlePhoto: string | null;
  memberSince: string;
  hasPassword: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [state, action, pending] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await updatePhoto(prev, formData);
    if (result.ok) setPreview(null);
    return result;
  }, INITIAL);

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
  };

  const cancel = () => {
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div>
      <form action={action} className="flex flex-col items-center pb-2 pt-2 text-center">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="group relative rounded-full"
          aria-label="Change photo"
        >
          <Avatar src={preview ?? photo ?? googlePhoto} name={name} size={104} className="shadow-lg ring-4 ring-white" />
          <span className="absolute inset-0 flex items-end justify-center rounded-full bg-black/0 pb-3 text-[11px] font-medium text-white opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100">
            Edit
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          name="avatar"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={onPick}
          className="sr-only"
          tabIndex={-1}
        />
        <p className="mt-3 text-[20px] font-bold text-gray-900">{name}</p>
        <p className="text-[12px] text-gray-500">{email}</p>

        <div className="mt-3 flex min-h-[28px] items-center gap-2">
          {preview ? (
            <>
              <button type="button" onClick={cancel} className={pushButton}>
                Cancel
              </button>
              <button type="submit" disabled={pending} className={primaryButton}>
                {pending ? "Saving…" : "Save Photo"}
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => fileRef.current?.click()} className={pushButton}>
                {photo ? "Change Photo…" : "Upload Photo…"}
              </button>
              {photo && (
                <button
                  type="submit"
                  name="remove"
                  value="1"
                  disabled={pending}
                  className={pushButton}
                >
                  Remove
                </button>
              )}
            </>
          )}
        </div>
        <div className="mt-1 min-h-[18px]">
          <Status error={fileError ?? state.error} ok={state.ok} okText="✓ Photo updated" />
        </div>
      </form>

      <Group>
        <Row label="Name & Account" detail="First name, last name">
          <Link href="/settings/account" className="text-[13px] text-gray-500 hover:text-gray-900">
            {name} ›
          </Link>
        </Row>
        <Row label="Login Password" detail={hasPassword ? "Password set" : "Signs in with Google only"}>
          <Link href="/settings/password" className="text-[13px] text-gray-500 hover:text-gray-900">
            {hasPassword ? "Change" : "Set Up"} ›
          </Link>
        </Row>
        <Row label="Member Since">
          <span className="text-[13px] text-gray-500">
            {new Date(memberSince).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </span>
        </Row>
      </Group>
    </div>
  );
}

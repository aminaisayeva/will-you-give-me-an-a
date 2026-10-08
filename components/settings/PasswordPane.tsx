"use client";

import { useActionState, useEffect, useState } from "react";
import { MIN_PASSWORD } from "@/lib/supabase";
import { changePassword, type FormState } from "@/app/actions/settings";
import { Group, primaryButton, pushButton, Row, Status } from "@/components/settings/ui";

const INITIAL: FormState = { ok: false, error: null, savedAt: 0 };

export default function PasswordPane({ email, hasPassword }: { email: string; hasPassword: boolean }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetKey, setSheetKey] = useState(0);
  const [lastChange, setLastChange] = useState<"changed" | "set" | null>(null);

  const open = () => {
    setSheetKey((k) => k + 1);
    setSheetOpen(true);
  };

  return (
    <div>
      <Group>
        <Row
          label="Login Password"
          detail={
            hasPassword
              ? "A password has been set for this account."
              : "This account signs in with Google. Set a password to also log in with your email."
          }
        >
          <button type="button" onClick={open} className={pushButton}>
            {hasPassword ? "Change…" : "Set Password…"}
          </button>
        </Row>
        <Row label="Account" detail="Your email is your account name on the lock screen.">
          <span className="truncate text-[13px] text-gray-500">{email}</span>
        </Row>
      </Group>

      <p className="mt-3 min-h-[18px] px-1 text-[12px] text-green-700" role="status">
        {lastChange ? `✓ Password ${lastChange}. Use it next time you log in.` : ""}
      </p>

      {sheetOpen && (
        <PasswordSheet
          key={sheetKey}
          hasPassword={hasPassword}
          onClose={() => setSheetOpen(false)}
          onDone={() => {
            setLastChange(hasPassword ? "changed" : "set");
            setSheetOpen(false);
          }}
        />
      )}
    </div>
  );
}

const sheetField =
  "w-full rounded-md border border-black/15 bg-white px-2.5 py-1.5 text-[13px] text-gray-900 shadow-sm outline-none focus:border-[#007aff] focus:ring-[3px] focus:ring-[#007aff]/30";

// The sheet that slides down from the window's title bar in macOS.
function PasswordSheet({
  hasPassword,
  onClose,
  onDone,
}: {
  hasPassword: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await changePassword(prev, formData);
    if (result.ok) onDone();
    return result;
  }, INITIAL);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-50 flex items-start justify-center bg-black/25 px-3 pt-6">
      <form
        action={action}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pw-title"
        className="w-full max-w-[400px] rounded-xl bg-[#f5f5f7] p-5 shadow-2xl ring-1 ring-black/10"
        style={{ animation: "dialog-pop 0.25s ease" }}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[22px] shadow-sm" style={{ background: "linear-gradient(180deg, #ff6b6b, #e5383b)" }}>
            {"\u{1F511}"}
          </span>
          <div>
            <h2 id="pw-title" className="text-[14px] font-semibold text-gray-900">
              {hasPassword ? "Change Password" : "Set Password"}
            </h2>
            <p className="mt-0.5 text-[12px] leading-snug text-gray-500">
              {hasPassword
                ? "Enter your old password, then choose a new one."
                : `Choose a password of at least ${MIN_PASSWORD} characters.`}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2.5">
          {hasPassword && (
            <>
              <label htmlFor="old_password" className="text-right text-[13px] text-gray-700">Old password:</label>
              <input id="old_password" name="old_password" type="password" required autoComplete="current-password" autoFocus className={sheetField} />
            </>
          )}
          <label htmlFor="new_password" className="text-right text-[13px] text-gray-700">New password:</label>
          <input id="new_password" name="new_password" type="password" required minLength={MIN_PASSWORD} autoComplete="new-password" autoFocus={!hasPassword} className={sheetField} />
          <label htmlFor="verify" className="text-right text-[13px] text-gray-700">Verify:</label>
          <input id="verify" name="verify" type="password" required minLength={MIN_PASSWORD} autoComplete="new-password" className={sheetField} />
        </div>

        <div className="mt-2 min-h-[18px] pl-1">
          <Status error={state.error} ok={false} />
        </div>

        <div className="mt-3 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={pushButton}>
            Cancel
          </button>
          <button type="submit" disabled={pending} className={primaryButton}>
            {pending ? "Saving…" : hasPassword ? "Change Password" : "Set Password"}
          </button>
        </div>
      </form>
    </div>
  );
}

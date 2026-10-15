"use client";

import { Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import Avatar from "@/components/Avatar";
import { updateCookedProfile } from "@/app/actions/cooked-account";
import { changePassword, updateName, type FormState } from "@/app/actions/settings";
import { ErrorText, field, UsernameField } from "@/components/safari/cooked/AuthPanel";
import { focusRing } from "@/components/safari/cooked/shared";
import { MIN_PASSWORD } from "@/lib/supabase";

const save = `rounded-xl bg-orange-600 px-4 py-2 text-[13.5px] font-semibold text-white transition hover:bg-orange-700 active:translate-y-px disabled:opacity-60 ${focusRing}`;
const label = "text-[13px] font-semibold text-stone-800";
const initial: FormState = { ok: false, error: null, savedAt: 0 };

function Section({ title, about, children }: { title: string; about: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-stone-200 py-8 first:border-t-0 first:pt-0 md:grid-cols-[220px_1fr]">
      <div>
        <h2 className="text-[16px] font-bold text-stone-900">{title}</h2>
        <p className="mt-1 text-[13px] text-stone-500">{about}</p>
      </div>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">{children}</div>
    </section>
  );
}

function Saved({ show }: { show: boolean }) {
  return show ? (
    <span role="status" className="text-[13px] font-medium text-emerald-700">
      Saved
    </span>
  ) : null;
}

function PublicProfile({ username, displayName, avatar }: { username: string; displayName: string; avatar: string | null }) {
  const router = useRouter();
  const [name, setName] = useState(displayName);
  const [handle, setHandle] = useState(username);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [remove, setRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const shown = preview ?? (remove ? null : avatar);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        setSaved(false);
        const data = new FormData();
        data.set("username", handle);
        data.set("display_name", name);
        if (file) data.set("avatar", file);
        else if (remove) data.set("remove_avatar", "1");
        start(async () => {
          const result = await updateCookedProfile(data);
          if (!result.ok) return setError(result.error);
          setFile(null);
          setPreview(null);
          setRemove(false);
          setSaved(true);
          router.refresh();
        });
      }}
      className="space-y-4"
    >
      <div className="flex items-center gap-4">
        <Avatar src={shown} name={name || handle} size={64} />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => fileRef.current?.click()} className={`flex items-center gap-1.5 rounded-lg bg-stone-100 px-3 py-1.5 text-[13px] font-semibold text-stone-800 hover:bg-stone-200 ${focusRing}`}>
            <Camera className="h-3.5 w-3.5" /> {shown ? "Change photo" : "Add photo"}
          </button>
          {shown && (
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setPreview(null);
                setRemove(true);
              }}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold text-stone-600 hover:bg-stone-100 ${focusRing}`}
            >
              Remove
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            if (f.size > 2 * 1024 * 1024) return setError("That photo is over 2 MB. Pick a smaller one.");
            setError(null);
            setFile(f);
            setPreview(URL.createObjectURL(f));
          }}
        />
      </div>
      <div>
        <label htmlFor="set-display" className={label}>
          Display name
        </label>
        <input id="set-display" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required className={`${field} mt-1`} />
      </div>
      <UsernameField value={handle} onChange={setHandle} />
      <ErrorText error={error} />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={save}>
          {pending ? "Saving…" : "Save profile"}
        </button>
        <Saved show={saved && !pending} />
      </div>
    </form>
  );
}

function Names({ firstName, lastName }: { firstName: string; lastName: string }) {
  const [state, action, pending] = useActionState(updateName, initial);
  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="set-first" className={label}>
            First name
          </label>
          <input id="set-first" name="first_name" defaultValue={firstName} required maxLength={60} autoComplete="given-name" className={`${field} mt-1`} />
        </div>
        <div>
          <label htmlFor="set-last" className={label}>
            Last name
          </label>
          <input id="set-last" name="last_name" defaultValue={lastName} required maxLength={60} autoComplete="family-name" className={`${field} mt-1`} />
        </div>
      </div>
      <ErrorText error={state.error} />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={save}>
          {pending ? "Saving…" : "Save name"}
        </button>
        <Saved show={state.ok && !pending} />
      </div>
    </form>
  );
}

function Password({ hasPassword }: { hasPassword: boolean }) {
  const [state, action, pending] = useActionState(changePassword, initial);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);
  return (
    <form ref={formRef} action={action} className="space-y-3">
      {hasPassword && (
        <div>
          <label htmlFor="set-old" className={label}>
            Current password
          </label>
          <input id="set-old" name="old_password" type="password" autoComplete="current-password" className={`${field} mt-1`} />
        </div>
      )}
      <div>
        <label htmlFor="set-new" className={label}>
          New password
        </label>
        <input id="set-new" name="new_password" type="password" minLength={MIN_PASSWORD} required autoComplete="new-password" className={`${field} mt-1`} />
      </div>
      <div>
        <label htmlFor="set-verify" className={label}>
          Confirm new password
        </label>
        <input id="set-verify" name="verify" type="password" minLength={MIN_PASSWORD} required autoComplete="new-password" className={`${field} mt-1`} />
      </div>
      <ErrorText error={state.error} />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={save}>
          {pending ? "Saving…" : hasPassword ? "Change password" : "Set password"}
        </button>
        <Saved show={state.ok && !pending} />
      </div>
    </form>
  );
}

export default function SettingsForms(props: {
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  displayName: string;
  avatar: string | null;
  hasPassword: boolean;
}) {
  return (
    <>
      <Section title="Public profile" about="What everyone sees on your posts and at your profile page.">
        <PublicProfile username={props.username} displayName={props.displayName} avatar={props.avatar} />
      </Section>
      <Section title="Your name" about="Your real first and last name. Kept private to your account.">
        <Names firstName={props.firstName} lastName={props.lastName} />
      </Section>
      <Section
        title="Password"
        about={props.hasPassword ? "Change the password you log in with." : "You sign in with Google. Set a password to log in with your email too."}
      >
        <Password hasPassword={props.hasPassword} />
      </Section>
      <Section title="Account" about="The email address you sign in with.">
        <p className="text-[14px] text-stone-800">{props.email}</p>
        <form action="/auth/signout" method="post" className="mt-4">
          <button type="submit" className={`rounded-xl bg-stone-100 px-4 py-2 text-[13.5px] font-semibold text-stone-800 hover:bg-stone-200 ${focusRing}`}>
            Log out
          </button>
        </form>
      </Section>
    </>
  );
}

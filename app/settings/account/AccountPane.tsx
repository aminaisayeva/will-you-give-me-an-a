"use client";

import { useActionState } from "react";
import Avatar from "@/components/Avatar";
import { updateName, type FormState } from "../actions";
import { Group, primaryButton, Row, Status, textField } from "../ui";

const INITIAL: FormState = { ok: false, error: null, savedAt: 0 };

export default function AccountPane({
  name,
  avatar,
  email,
  firstName,
  lastName,
  loginMethods,
}: {
  name: string;
  avatar: string | null;
  email: string;
  firstName: string;
  lastName: string;
  loginMethods: string;
}) {
  const [state, action, pending] = useActionState(updateName, INITIAL);

  return (
    <form action={action}>
      <Group title="Current User">
        <Row
          label={<span className="font-semibold">{name}</span>}
          detail="Admin"
        >
          <Avatar src={avatar} name={name} size={40} />
        </Row>
      </Group>

      <Group title="Account Information">
        <Row label={<label htmlFor="first_name">First Name</label>}>
          <input id="first_name" name="first_name" required maxLength={60} autoComplete="given-name" defaultValue={firstName} className={textField} />
        </Row>
        <Row label={<label htmlFor="last_name">Last Name</label>}>
          <input id="last_name" name="last_name" required maxLength={60} autoComplete="family-name" defaultValue={lastName} className={textField} />
        </Row>
        <Row label="Account Email" detail="Used to sign in. It can't be changed here.">
          <span className="truncate text-[13px] text-gray-500">{email}</span>
        </Row>
        <Row label="Signs In With">
          <span className="text-[13px] text-gray-500">{loginMethods}</span>
        </Row>
      </Group>

      <div className="mt-4 flex items-center justify-end gap-3">
        <div className="mr-auto">
          <Status error={state.error} ok={state.ok} />
        </div>
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

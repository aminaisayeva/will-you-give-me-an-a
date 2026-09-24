"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useMemo,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import type { Email } from "@/lib/supabase";
import { FONT_STACK, WALLPAPER } from "@/lib/desktop-theme";
import { sendEmail, type SendState } from "./actions";
import { getServerSnapshot, getSnapshot, markRead, subscribe } from "./read-store";

type Folder = "inbox" | "sent";

const FOLDERS: { id: Folder; label: string; glyph: string }[] = [
  { id: "inbox", label: "Inbox", glyph: "\u{1F4E5}" },
  { id: "sent", label: "Sent", glyph: "\u{1F4E4}" },
];

const INITIAL_SEND_STATE: SendState = { ok: false, error: null, sentAt: 0 };

function formatListDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFullDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function MailApp({
  emails,
  loadError,
}: {
  emails: Email[];
  loadError: string | null;
}) {
  const router = useRouter();
  const [folder, setFolder] = useState<Folder>("inbox");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeKey, setComposeKey] = useState(0);
  const [refreshing, startRefresh] = useTransition();

  const readJson = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const readIds = useMemo(() => new Set<string>(JSON.parse(readJson)), [readJson]);

  const counts = useMemo(
    () => ({
      inbox: emails.filter((e) => e.folder === "inbox" && !readIds.has(e.id)).length,
      sent: emails.filter((e) => e.folder === "sent").length,
    }),
    [emails, readIds],
  );

  const q = query.trim().toLowerCase();
  const visible = emails.filter(
    (e) =>
      e.folder === folder &&
      (!q ||
        [e.subject, e.body, e.sender_name, e.sender_email, e.recipient_email].some((v) =>
          v.toLowerCase().includes(q),
        )),
  );

  const selected = visible.find((e) => e.id === selectedId) ?? null;

  const openEmail = (email: Email) => {
    setSelectedId(email.id);
    if (email.folder === "inbox") markRead(email.id);
  };

  const switchFolder = (f: Folder) => {
    setFolder(f);
    setSelectedId(null);
  };

  const [sendState, sendAction, sending] = useActionState(
    async (prev: SendState, formData: FormData) => {
      const result = await sendEmail(prev, formData);
      if (result.ok) {
        try {
          window.localStorage.setItem(
            "will-you-give-me-an-a:mail:sender",
            JSON.stringify({
              name: formData.get("sender_name"),
              email: formData.get("sender_email"),
            }),
          );
        } catch {
          /* ignore */
        }
        setComposeOpen(false);
        setFolder("sent");
        setSelectedId(null);
        setQuery("");
      }
      return result;
    },
    INITIAL_SEND_STATE,
  );

  const openCompose = () => {
    setComposeKey((k) => k + 1);
    setComposeOpen(true);
  };

  return (
    <div
      className="fixed inset-0 overflow-hidden text-gray-900"
      style={{ fontFamily: FONT_STACK, background: WALLPAPER }}
    >
      {/* Menu bar */}
      <header className="absolute inset-x-0 top-0 z-40 flex h-7 items-center justify-between border-b border-white/10 bg-black/30 px-4 text-[13px] text-white/90 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <span aria-hidden="true" className="text-[15px] leading-none">{""}</span>
          <span className="font-semibold">Mail</span>
          <Link href="/" className="hover:text-white">
            ← Desktop
          </Link>
        </div>
        <span className="hidden text-white/70 sm:inline">
          {emails.length} messages from Supabase
        </span>
      </header>

      {/* Window */}
      <main className="absolute inset-0 flex items-center justify-center px-2 pb-3 pt-10 sm:px-6 sm:pb-6">
        <div
          className="flex h-full w-full max-w-[1120px] flex-col overflow-hidden rounded-xl bg-white/95 backdrop-blur-xl"
          style={{
            boxShadow: "0 30px 70px rgba(0,0,0,0.5), 0 2px 10px rgba(0,0,0,0.25)",
          }}
        >
          {/* Title bar + toolbar */}
          <div
            className="relative flex h-11 shrink-0 items-center gap-3 border-b border-black/10 px-3"
            style={{ background: "linear-gradient(180deg, #f7f7f7, #ececec)" }}
          >
            <div className="flex items-center gap-2">
              <Link
                href="/"
                aria-label="Close Mail"
                className="h-3 w-3 rounded-full border border-black/10 bg-[#ff5f57]"
              />
              <span className="h-3 w-3 rounded-full border border-black/10 bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full border border-black/10 bg-[#28c840]" />
            </div>
            <span className="pointer-events-none absolute inset-0 hidden items-center justify-center text-[13px] font-semibold text-gray-600 md:flex">
              {FOLDERS.find((f) => f.id === folder)?.label} — Mail
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => startRefresh(() => router.refresh())}
                className="rounded-md px-2 py-1 text-[13px] text-gray-600 hover:bg-black/5"
                title="Get new mail"
              >
                <span className={refreshing ? "inline-block animate-spin" : "inline-block"}>↻</span>
              </button>
              <button
                type="button"
                onClick={openCompose}
                className="rounded-md bg-[#007aff] px-3 py-1 text-[13px] font-medium text-white shadow-sm hover:brightness-110"
              >
                ✏️ New Message
              </button>
            </div>
          </div>

          {/* Mobile folder tabs */}
          <div className="flex shrink-0 gap-1 border-b border-black/10 bg-gray-50 px-2 py-1.5 md:hidden">
            {FOLDERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => switchFolder(f.id)}
                className={`flex-1 rounded-md px-2 py-1 text-[13px] ${
                  folder === f.id ? "bg-black/10 font-semibold" : "text-gray-600"
                }`}
              >
                {f.label}
                {counts[f.id] > 0 && ` (${counts[f.id]})`}
              </button>
            ))}
          </div>

          <div className="flex min-h-0 flex-1">
            {/* Sidebar */}
            <aside className="hidden w-52 shrink-0 flex-col border-r border-black/10 bg-[#f1f0f5]/90 p-3 md:flex">
              <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Mailboxes
              </p>
              {FOLDERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => switchFolder(f.id)}
                  className={`flex items-center justify-between rounded-md px-2 py-1.5 text-left text-[13px] ${
                    folder === f.id ? "bg-black/10 font-medium" : "hover:bg-black/5"
                  }`}
                >
                  <span>
                    <span className="mr-2">{f.glyph}</span>
                    {f.label}
                  </span>
                  {counts[f.id] > 0 && (
                    <span
                      className={`rounded-full px-1.5 text-[11px] ${
                        f.id === "inbox" ? "bg-[#007aff] text-white" : "text-gray-500"
                      }`}
                    >
                      {counts[f.id]}
                    </span>
                  )}
                </button>
              ))}
              <p className="mt-auto px-2 text-[11px] leading-snug text-gray-400">
                Messages are stored in a Supabase table and loaded on every visit.
              </p>
            </aside>

            {/* Message list */}
            <section
              className={`min-w-0 flex-col border-r border-black/10 md:flex md:w-80 md:shrink-0 ${
                selected ? "hidden" : "flex w-full"
              }`}
            >
              <div className="shrink-0 border-b border-black/10 p-2">
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  className="w-full rounded-md border border-black/10 bg-black/5 px-3 py-1.5 text-[13px] outline-none focus:border-[#007aff] focus:bg-white"
                />
              </div>
              <ul className="min-h-0 flex-1 overflow-y-auto">
                {loadError && (
                  <li className="m-3 rounded-md bg-red-50 p-3 text-[13px] text-red-700">
                    Could not load mail: {loadError}
                  </li>
                )}
                {!loadError && visible.length === 0 && (
                  <li className="p-6 text-center text-[13px] text-gray-400">
                    {q ? `No messages match “${query.trim()}”` : `No messages in ${folder === "inbox" ? "Inbox" : "Sent"}`}
                  </li>
                )}
                {visible.map((email) => {
                  const unread = email.folder === "inbox" && !readIds.has(email.id);
                  const active = email.id === selectedId;
                  return (
                    <li key={email.id}>
                      <button
                        type="button"
                        onClick={() => openEmail(email)}
                        className={`relative block w-full border-b border-black/5 py-2.5 pl-6 pr-3 text-left ${
                          active ? "bg-[#007aff] text-white" : "hover:bg-black/[0.03]"
                        }`}
                      >
                        {unread && (
                          <span
                            className={`absolute left-2 top-4 h-2 w-2 rounded-full ${
                              active ? "bg-white" : "bg-[#007aff]"
                            }`}
                          />
                        )}
                        <div className="flex items-baseline justify-between gap-2">
                          <span className={`truncate text-[13px] ${unread ? "font-bold" : "font-semibold"}`}>
                            {email.folder === "inbox" ? email.sender_name : `To: ${email.recipient_email}`}
                          </span>
                          <span className={`shrink-0 text-[11px] ${active ? "text-white/80" : "text-gray-400"}`}>
                            {formatListDate(email.created_at)}
                          </span>
                        </div>
                        <p className="truncate text-[12px]">{email.subject}</p>
                        <p className={`line-clamp-2 text-[12px] ${active ? "text-white/80" : "text-gray-500"}`}>
                          {email.body}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Reader */}
            <article className={`min-w-0 flex-1 flex-col ${selected ? "flex" : "hidden md:flex"}`}>
              {selected ? (
                <>
                  <div className="shrink-0 border-b border-black/10 px-5 py-4">
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      className="mb-2 text-[13px] text-[#007aff] md:hidden"
                    >
                      ‹ {folder === "inbox" ? "Inbox" : "Sent"}
                    </button>
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-gray-400 to-gray-500 text-[14px] font-semibold text-white">
                        {initials(selected.sender_name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                          <p className="text-[14px] font-semibold">{selected.sender_name}</p>
                          <p className="text-[12px] text-gray-400">{formatFullDate(selected.created_at)}</p>
                        </div>
                        <p className="break-all text-[12px] text-gray-500">{selected.sender_email}</p>
                        <p className="text-[18px] font-bold leading-snug">{selected.subject}</p>
                        <p className="break-all text-[12px] text-gray-500">To: {selected.recipient_email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap break-words px-5 py-4 text-[14px] leading-relaxed text-gray-800">
                    {selected.body}
                  </div>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center text-gray-400">
                  <span className="text-[44px] opacity-60">{"\u{1F4E7}"}</span>
                  <p className="mt-2 text-[13px]">No Message Selected</p>
                </div>
              )}
            </article>
          </div>
        </div>
      </main>

      {composeOpen && (
        <Compose
          key={composeKey}
          action={sendAction}
          pending={sending}
          error={sendState.error}
          onClose={() => setComposeOpen(false)}
        />
      )}
    </div>
  );
}

function loadSender(): { name: string; email: string } {
  try {
    const raw = window.localStorage.getItem("will-you-give-me-an-a:mail:sender");
    if (raw) {
      const parsed = JSON.parse(raw);
      return { name: String(parsed.name ?? ""), email: String(parsed.email ?? "") };
    }
  } catch {
    /* ignore */
  }
  return { name: "", email: "" };
}

function Compose({
  action,
  pending,
  error,
  onClose,
}: {
  action: (formData: FormData) => void;
  pending: boolean;
  error: string | null;
  onClose: () => void;
}) {
  // Compose only mounts after a click, so reading localStorage here is safe.
  const [sender] = useState(loadSender);
  const inputClass =
    "min-w-0 flex-1 bg-transparent py-2 text-[13px] outline-none placeholder:text-gray-300";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-3">
      <form
        action={action}
        className="flex max-h-[90vh] w-full max-w-[620px] flex-col overflow-hidden rounded-xl bg-white"
        style={{ boxShadow: "0 30px 70px rgba(0,0,0,0.5)" }}
      >
        <div
          className="relative flex h-9 shrink-0 items-center border-b border-black/10 px-3"
          style={{ background: "linear-gradient(180deg, #f7f7f7, #ececec)" }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Discard message"
            className="h-3 w-3 rounded-full border border-black/10 bg-[#ff5f57]"
          />
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[13px] font-semibold text-gray-600">
            New Message
          </span>
          <button
            type="submit"
            disabled={pending}
            className="ml-auto rounded-md bg-[#007aff] px-3 py-1 text-[12px] font-medium text-white disabled:opacity-60"
          >
            {pending ? "Sending…" : "Send"}
          </button>
        </div>

        <div className="flex flex-col px-4">
          <label className="flex items-center gap-2 border-b border-black/10">
            <span className="w-16 shrink-0 text-[13px] text-gray-400">To:</span>
            <input name="recipient_email" type="email" required maxLength={254} defaultValue="professor@university.edu" className={inputClass} />
          </label>
          <label className="flex items-center gap-2 border-b border-black/10">
            <span className="w-16 shrink-0 text-[13px] text-gray-400">From:</span>
            <input name="sender_name" required maxLength={80} placeholder="Your name" defaultValue={sender.name} className={inputClass} />
            <input name="sender_email" type="email" required maxLength={254} placeholder="you@example.com" defaultValue={sender.email} className={inputClass} />
          </label>
          <label className="flex items-center gap-2 border-b border-black/10">
            <span className="w-16 shrink-0 text-[13px] text-gray-400">Subject:</span>
            <input name="subject" required maxLength={200} defaultValue="Will you give me an A?" className={inputClass} />
          </label>
        </div>

        <textarea
          name="body"
          required
          maxLength={5000}
          rows={10}
          placeholder="Write your message…"
          className="min-h-[200px] flex-1 resize-none px-4 py-3 text-[14px] outline-none"
        />

        {error && (
          <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-[12px] text-red-700">{error}</p>
        )}
      </form>
    </div>
  );
}

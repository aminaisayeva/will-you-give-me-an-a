"use client";

import { ArrowLeft, ArrowRight, Flame, Globe, Lock, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAccount } from "@/components/os/AccountContext";
import Cooked from "@/components/safari/Cooked";
import SiteVote from "@/components/safari/SiteVote";
import { Centered, timeAgo } from "@/components/safari/util";
import WebsiteMaker from "@/components/safari/WebsiteMaker";
import { deleteSite, getSite } from "@/app/actions/sites";
import { useOS } from "@/lib/os/store";
import { addressFromInput, builtInSite, MAX_PROMPT, type BuiltInSite, type SiteSummary } from "@/lib/sites";

type View =
  | { kind: "home" }
  | { kind: "loading"; input: string }
  | { kind: "builtin"; site: BuiltInSite }
  | { kind: "site"; site: SiteSummary; myVote: 1 | -1 | 0 }
  | { kind: "notfound"; input: string; isAddress: boolean };

// History entries are either the start page or an address.
type Entry = "home" | string;

const FAVORITES: { address: BuiltInSite; label: string; icon: typeof Flame; bg: string }[] = [
  { address: "cooked.ai", label: "cooked.ai", icon: Flame, bg: "linear-gradient(135deg, #fb923c, #dc2626)" },
];

// Safari: a browser over this app's own little internet. cooked.ai is the
// featured site; websitemaker.com (unlisted) builds new sites with AI; built
// sites live at their own addresses.
export default function SafariWindow() {
  const account = useAccount();
  const initialInput = useOS.getState().windows.safari.params.url ?? "";

  const [view, setView] = useState<View>(() => (initialInput ? { kind: "loading", input: initialInput } : { kind: "home" }));
  const [address, setAddress] = useState(initialInput);
  const [nav, setNav] = useState<{ entries: Entry[]; index: number }>({ entries: ["home"], index: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const navId = useRef(0);

  const push = (entry: Entry) =>
    setNav((n) => ({ entries: [...n.entries.slice(0, n.index + 1), entry], index: n.index + 1 }));

  // Look an address up. Only sets state after awaiting, so it can also run
  // from an effect.
  const resolve = async (input: string, record: boolean) => {
    const id = ++navId.current;
    const addr = addressFromInput(input);
    const builtin = builtInSite(addr);
    if (builtin) {
      await Promise.resolve();
      if (id !== navId.current) return;
      setView({ kind: "builtin", site: builtin });
      setAddress(builtin);
      if (record) push(builtin);
      return;
    }
    const detail = addr ? await getSite(addr) : null;
    if (id !== navId.current) return;
    if (detail?.site) {
      setView({ kind: "site", site: detail.site, myVote: detail.myVote });
      setAddress(detail.site.slug);
      if (record) push(detail.site.slug);
    } else {
      setView({ kind: "notfound", input: addr ?? input, isAddress: Boolean(addr) });
    }
  };

  const go = (raw: string, record = true) => {
    const input = raw.trim().slice(0, MAX_PROMPT);
    if (!input) return;
    setAddress(addressFromInput(input) ?? input);
    setView({ kind: "loading", input });
    void resolve(input, record);
  };

  const goHome = (record = true) => {
    navId.current++;
    setView({ kind: "home" });
    setAddress("");
    if (record) push("home");
    inputRef.current?.focus();
  };

  const step = (delta: number) => {
    const next = nav.index + delta;
    if (next < 0 || next >= nav.entries.length) return;
    setNav({ ...nav, index: next });
    const entry = nav.entries[next];
    if (entry === "home") goHome(false);
    else go(entry, false);
  };

  // Another app asked Safari to open an address (Terminal, Spotlight, a link).
  useEffect(() => {
    // Deferred a tick so the first lookup doesn't set state during the effect.
    if (initialInput) queueMicrotask(() => void resolve(initialInput, true));
    return useOS.subscribe((s, prev) => {
      const now = s.windows.safari;
      if (now.openCount !== prev.windows.safari.openCount && now.params.url) go(now.params.url);
    });
    // Runs once per mount: later requests arrive through the subscription.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const secure = view.kind === "site" || view.kind === "builtin";

  return (
    <div className="flex h-full flex-col bg-white text-gray-900">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-black/10 bg-[#f6f6f6] px-2.5 py-2">
        <button type="button" onClick={() => step(-1)} disabled={nav.index === 0} aria-label="Back" className="rounded-md p-1.5 text-gray-600 hover:bg-black/5 disabled:opacity-30">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => step(1)} disabled={nav.index >= nav.entries.length - 1} aria-label="Forward" className="rounded-md p-1.5 text-gray-600 hover:bg-black/5 disabled:opacity-30">
          <ArrowRight className="h-4 w-4" />
        </button>
        <form
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-black/[0.06] px-3 py-1.5 focus-within:bg-white focus-within:ring-[3px] focus-within:ring-[#007aff]/30"
          onSubmit={(e) => {
            e.preventDefault();
            go(address);
          }}
        >
          {secure ? <Lock className="h-3.5 w-3.5 shrink-0 text-gray-500" /> : <Globe className="h-3.5 w-3.5 shrink-0 text-gray-400" />}
          <input
            ref={inputRef}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onFocus={(e) => e.target.select()}
            maxLength={MAX_PROMPT}
            placeholder="Search or enter website name"
            aria-label="Address"
            spellCheck={false}
            autoCapitalize="off"
            className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-gray-500"
          />
        </form>
        <button
          type="button"
          onClick={() => (view.kind === "home" ? undefined : go(address, false))}
          aria-label="Reload"
          className="rounded-md p-1.5 text-gray-600 hover:bg-black/5"
        >
          <RefreshCw className={`h-4 w-4 ${view.kind === "loading" ? "animate-spin" : ""}`} />
        </button>
        <button type="button" onClick={() => goHome()} className="hidden rounded-md px-2 py-1 text-[12px] text-gray-600 hover:bg-black/5 sm:block">
          Start Page
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        {view.kind === "home" && <StartPage onOpen={(a) => go(a)} />}
        {view.kind === "loading" && <Centered spinner text="Loading…" />}
        {view.kind === "notfound" && <NotFound input={view.input} isAddress={view.isAddress} onOpen={(a) => go(a)} />}
        {view.kind === "builtin" && view.site === "cooked.ai" && <Cooked />}
        {view.kind === "builtin" && view.site === "websitemaker.com" && <WebsiteMaker onOpen={(slug) => go(slug)} />}
        {view.kind === "site" && (
          <SiteView
            site={view.site}
            myVote={view.myVote}
            userId={account?.id ?? null}
            onVoted={(site, myVote) => setView({ kind: "site", site, myVote })}
            onDeleted={() => go("websitemaker.com")}
          />
        )}
      </div>
    </div>
  );
}

function StartPage({ onOpen }: { onOpen: (address: string) => void }) {
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-[#f2f2f7] to-white">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h2 className="text-[20px] font-bold">Favorites</h2>
        <div className="mt-4 grid grid-cols-3 gap-5 sm:grid-cols-5">
          {FAVORITES.map((f) => (
            <button key={f.address} type="button" onClick={() => onOpen(f.address)} className="group flex flex-col items-center gap-2">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-md transition group-hover:scale-105" style={{ background: f.bg }}>
                <f.icon className="h-8 w-8" />
              </span>
              <span className="text-[12px] text-gray-700">{f.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-10 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="text-[14px] font-semibold">Welcome to Safari</p>
          <p className="mt-1 text-[13px] leading-relaxed text-gray-500">
            Type a website’s name in the address bar to visit it. This Mac’s internet is small, but some of it is very well hidden.
          </p>
        </div>
      </div>
    </div>
  );
}

function NotFound({ input, isAddress, onOpen }: { input: string; isAddress: boolean; onOpen: (address: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 bg-[#f6f6f6] px-6 text-center">
      <Globe className="h-12 w-12 text-gray-300" />
      <h2 className="mt-2 text-[20px] font-semibold text-gray-700">{isAddress ? "Safari Can’t Find the Server" : "Safari Can’t Search the Web"}</h2>
      <p className="max-w-md text-[13px] text-gray-500">
        {isAddress
          ? `Safari can’t open the page “${input}” because Safari can’t find the server “${input}”.`
          : `This Mac isn’t connected to a search engine. Type a website’s name instead.`}
      </p>
      <button type="button" onClick={() => onOpen("cooked.ai")} className="mt-3 rounded-md border border-black/10 bg-white px-3 py-1 text-[13px] shadow-sm hover:bg-gray-50">
        Go to cooked.ai
      </button>
    </div>
  );
}

function SiteView({
  site,
  myVote,
  userId,
  onVoted,
  onDeleted,
}: {
  site: SiteSummary;
  myVote: 1 | -1 | 0;
  userId: string | null;
  onVoted: (site: SiteSummary, myVote: 1 | -1 | 0) => void;
  onDeleted: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const mine = userId === site.author_id;

  const share = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/safari/${site.slug}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Info bar */}
      <div className="relative flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-black/10 bg-white px-3 py-1.5">
        <SiteVote site={site} myVote={myVote} userId={userId} onChange={onVoted} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold">{site.title}</p>
          <p className="truncate text-[11px] text-gray-500">
            built by {site.author_name ?? "a student"} · {timeAgo(site.created_at)}
          </p>
        </div>
        <button type="button" onClick={() => setShowPrompt((v) => !v)} className="rounded-md border border-black/10 px-2 py-0.5 text-[12px] text-gray-700 hover:bg-gray-50">
          {showPrompt ? "Hide Prompt" : "Prompt"}
        </button>
        <button type="button" onClick={share} className="rounded-md border border-black/10 px-2 py-0.5 text-[12px] text-gray-700 hover:bg-gray-50">
          {copied ? "✓ Link Copied" : "Share"}
        </button>
        {mine &&
          (confirmDelete ? (
            <span className="flex items-center gap-1">
              <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-md px-2 py-0.5 text-[12px] text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const res = await deleteSite(site.id);
                  if (res.ok) onDeleted();
                }}
                className="rounded-md bg-red-500 px-2 py-0.5 text-[12px] font-medium text-white"
              >
                Delete
              </button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className="rounded-md px-2 py-0.5 text-[12px] text-red-600 hover:bg-red-50">
              Delete Site
            </button>
          ))}
        {showPrompt && (
          <div className="absolute left-3 right-3 top-full z-10 mt-1 rounded-lg border border-black/10 bg-white p-3 text-[12px] shadow-xl">
            <p className="font-semibold text-gray-900">What {site.author_name ?? "they"} asked for</p>
            <p className="mt-1 whitespace-pre-wrap text-gray-700">“{site.prompt}”</p>
            {site.description && <p className="mt-2 text-gray-500">{site.description}</p>}
          </div>
        )}
      </div>

      <div className="relative min-h-0 flex-1 bg-white">
        {!loaded && <Centered spinner text={`Opening ${site.slug}…`} />}
        <iframe
          key={site.slug}
          src={`/s/${encodeURIComponent(site.slug)}`}
          title={site.title}
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 h-full w-full border-0 ${loaded ? "" : "opacity-0"}`}
        />
      </div>
    </div>
  );
}


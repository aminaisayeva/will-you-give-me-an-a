"use client";

import { ArrowLeft, ArrowRight, Globe, Lock, RefreshCw, Shuffle, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAccount } from "@/components/os/AccountContext";
import SiteVote from "@/components/safari/SiteVote";
import {
  deleteSite,
  getSite,
  listSites,
  randomSiteSlug,
  type SiteList,
  type SiteTab,
} from "@/app/actions/sites";
import { useOS } from "@/lib/os/store";
import { addressFromInput, MAX_PROMPT, type SiteSummary } from "@/lib/sites";

type View =
  | { kind: "home" }
  | { kind: "loading"; input: string }
  | { kind: "building"; input: string }
  | { kind: "site"; site: SiteSummary; myVote: 1 | -1 | 0 }
  | { kind: "missing"; input: string; reason: "guest" | "error"; message?: string };

// History entries are either the start page or a site address.
type Entry = "home" | string;

const SUGGESTIONS = [
  "bodega-cats.nyc",
  "butler-library-seat-finder.com",
  "columbia-dining-hall-tierlist.com",
  "midwest-kid-nyc-survival-guide.org",
  "1-train-delay-excuses.com",
  "a dating app for people who stand on the left side of the escalator",
];

const BUILD_STEPS = [
  "Registering the domain…",
  "Hiring an intern to write the copy…",
  "Picking a font that says “NYC, but make it Midwest”…",
  "Testing it on the 1 train’s Wi-Fi…",
  "Adding one (1) bodega cat…",
  "Asking Gemini very nicely…",
  "Making it look good on your phone…",
];

const TABS: { id: SiteTab; label: string }[] = [
  { id: "trending", label: "🔥 Trending" },
  { id: "new", label: "🆕 New" },
  { id: "top", label: "🏆 All-Time" },
  { id: "mine", label: "⭐ My Sites" },
];

export default function SafariWindow() {
  const account = useAccount();
  const initialInput = useOS.getState().windows.safari.params.url ?? "";

  const [view, setView] = useState<View>(() => (initialInput ? { kind: "loading", input: initialInput } : { kind: "home" }));
  const [address, setAddress] = useState(initialInput);
  const [nav, setNav] = useState<{ entries: Entry[]; index: number }>({ entries: ["home"], index: 0 });
  const [homeKey, setHomeKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navId = useRef(0);
  // Read through a ref so requests from other apps see the current account.
  const accountRef = useRef(account);
  useEffect(() => {
    accountRef.current = account;
  }, [account]);

  const push = (entry: Entry) =>
    setNav((n) => ({ entries: [...n.entries.slice(0, n.index + 1), entry], index: n.index + 1 }));

  const show = (site: SiteSummary, myVote: 1 | -1 | 0, record: boolean) => {
    setView({ kind: "site", site, myVote });
    setAddress(site.slug);
    if (record) push(site.slug);
  };

  // Look an address up; build it with AI if it doesn't exist yet. Only sets
  // state after awaiting, so it can also run from an effect.
  const resolve = async (input: string, record: boolean) => {
    const id = ++navId.current;
    const stale = () => id !== navId.current;
    const addr = addressFromInput(input);

    if (addr) {
      const detail = await getSite(addr);
      if (stale()) return;
      if (detail.site) return show(detail.site, detail.myVote, record);
    }
    if (!accountRef.current) {
      setView({ kind: "missing", input: addr ?? input, reason: "guest" });
      return;
    }

    setView({ kind: "building", input: addr ?? input });
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const data = (await res.json().catch(() => ({}))) as { slug?: string; error?: string };
      if (stale()) return;
      if (!res.ok || !data.slug) {
        setView({ kind: "missing", input: addr ?? input, reason: "error", message: data.error ?? "Couldn't build that site." });
        return;
      }
      const detail = await getSite(data.slug);
      if (stale()) return;
      if (detail.site) show(detail.site, detail.myVote, record);
      setHomeKey((k) => k + 1);
    } catch {
      if (!stale()) setView({ kind: "missing", input: addr ?? input, reason: "error", message: "Network error. Try again." });
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

  // Another app asked Safari to open a URL (Terminal, Spotlight, a shared link).
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

  const lucky = async () => {
    const slug = await randomSiteSlug();
    if (slug) go(slug);
  };

  const busy = view.kind === "loading" || view.kind === "building";

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
          {view.kind === "site" ? <Lock className="h-3.5 w-3.5 shrink-0 text-gray-500" /> : <Globe className="h-3.5 w-3.5 shrink-0 text-gray-400" />}
          <input
            ref={inputRef}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onFocus={(e) => e.target.select()}
            maxLength={MAX_PROMPT}
            placeholder="Type a web address or describe any website"
            aria-label="Address or website idea"
            className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-gray-500"
          />
        </form>
        <button
          type="button"
          onClick={() => (view.kind === "site" ? go(view.site.slug, false) : view.kind === "home" ? setHomeKey((k) => k + 1) : undefined)}
          aria-label="Reload"
          className="rounded-md p-1.5 text-gray-600 hover:bg-black/5"
        >
          <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
        </button>
        <button type="button" onClick={() => goHome()} className="hidden rounded-md px-2 py-1 text-[12px] text-gray-600 hover:bg-black/5 sm:block">
          Start Page
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        {view.kind === "home" && <StartPage key={homeKey} onOpen={(s) => go(s)} onLucky={lucky} signedIn={!!account} />}
        {view.kind === "loading" && <Centered spinner text="Loading…" />}
        {view.kind === "building" && <Building input={view.input} />}
        {view.kind === "missing" && (
          <Missing
            view={view}
            onRetry={() => go(view.input)}
            onHome={() => goHome()}
          />
        )}
        {view.kind === "site" && (
          <SiteView
            site={view.site}
            myVote={view.myVote}
            userId={account?.id ?? null}
            onVoted={(site, myVote) => setView({ kind: "site", site, myVote })}
            onDeleted={() => {
              setHomeKey((k) => k + 1);
              goHome();
            }}
          />
        )}
      </div>
    </div>
  );
}

function Centered({ spinner, text }: { spinner?: boolean; text: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-[13px] text-gray-500">
      {spinner && <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#007aff] border-t-transparent" />}
      {text}
    </div>
  );
}

function Building({ input }: { input: string }) {
  const [stepIndex, setStepIndex] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setStepIndex((i) => (i + 1) % BUILD_STEPS.length), 2600);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#f5f7ff] to-white px-6 text-center">
      <div className="relative h-16 w-16">
        <span className="absolute inset-0 animate-ping rounded-2xl bg-[#007aff]/20" />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5ac8fa] to-[#5856d6] text-white shadow-lg">
          <Sparkles className="h-8 w-8" />
        </span>
      </div>
      <div>
        <p className="text-[16px] font-semibold">Building {input.length > 60 ? `${input.slice(0, 60)}…` : input}</p>
        <p className="mt-1 h-5 text-[13px] text-gray-500 transition-opacity">{BUILD_STEPS[stepIndex]}</p>
      </div>
      <p className="text-[11px] text-gray-400">Gemini usually takes 10–40 seconds.</p>
    </div>
  );
}

function Missing({
  view,
  onRetry,
  onHome,
}: {
  view: { input: string; reason: "guest" | "error"; message?: string };
  onRetry: () => void;
  onHome: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <Globe className="h-8 w-8 text-gray-400" />
      </span>
      {view.reason === "guest" ? (
        <>
          <h2 className="mt-2 text-[18px] font-semibold">Nobody has built {view.input} yet</h2>
          <p className="max-w-sm text-[13px] text-gray-500">Sign in and Safari will build it for you with AI. Then everyone can visit and vote on it.</p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={onHome} className="rounded-md border border-black/10 bg-white px-3 py-1 text-[13px] shadow-sm hover:bg-gray-50">
              Start Page
            </button>
            <a href="/login" className="rounded-md bg-[#007aff] px-3.5 py-1 text-[13px] font-medium text-white shadow-sm hover:brightness-110">
              Sign In to Build
            </a>
          </div>
        </>
      ) : (
        <>
          <h2 className="mt-2 text-[18px] font-semibold">Safari can’t build this site</h2>
          <p className="max-w-sm text-[13px] text-gray-500">{view.message}</p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={onHome} className="rounded-md border border-black/10 bg-white px-3 py-1 text-[13px] shadow-sm hover:bg-gray-50">
              Start Page
            </button>
            <button type="button" onClick={onRetry} className="rounded-md bg-[#007aff] px-3.5 py-1 text-[13px] font-medium text-white shadow-sm hover:brightness-110">
              Try Again
            </button>
          </div>
        </>
      )}
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

function StartPage({ onOpen, onLucky, signedIn }: { onOpen: (slug: string) => void; onLucky: () => void; signedIn: boolean }) {
  const [tab, setTab] = useState<SiteTab>("trending");
  const [list, setList] = useState<SiteList | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listSites(tab).then((result) => {
      if (cancelled) return;
      setList(result);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const updateSite = (site: SiteSummary, myVote: 1 | -1 | 0) =>
    setList((l) => {
      if (!l) return l;
      const myVotes = { ...l.myVotes };
      if (myVote) myVotes[site.id] = myVote;
      else delete myVotes[site.id];
      return { ...l, sites: l.sites.map((s) => (s.id === site.id ? site : s)), myVotes };
    });

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-[#f7f7fa] to-white">
      <div className="mx-auto max-w-3xl px-5 py-8">
        <div className="text-center">
          <h1 className="text-[26px] font-bold tracking-tight">Build any website.</h1>
          <p className="mx-auto mt-1 max-w-md text-[13px] text-gray-500">
            Type a web address that doesn’t exist yet, or describe a site, and AI will build it. Visit what everyone else made and vote for the best.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onOpen(s)}
              className="max-w-full truncate rounded-full border border-black/10 bg-white px-3 py-1 text-[12px] text-gray-700 shadow-sm hover:border-[#007aff] hover:text-[#007aff]"
            >
              {s}
            </button>
          ))}
          <button type="button" onClick={onLucky} className="flex items-center gap-1 rounded-full bg-gray-900 px-3 py-1 text-[12px] font-medium text-white shadow-sm hover:bg-gray-700">
            <Shuffle className="h-3 w-3" /> I’m Feeling Lucky
          </button>
        </div>
        {!signedIn && (
          <p className="mt-3 text-center text-[12px] text-gray-500">
            Browsing as a guest. <a href="/login" className="text-[#007aff] hover:underline">Sign in</a> to build sites and vote.
          </p>
        )}

        <div className="mt-8 flex gap-1 overflow-x-auto border-b border-black/10">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                if (t.id === tab) return;
                setLoading(true);
                setTab(t.id);
              }}
              className={`-mb-px shrink-0 border-b-2 px-3 py-2 text-[13px] ${
                tab === t.id ? "border-[#007aff] font-semibold text-gray-900" : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <Centered spinner text="Loading sites…" />
        ) : list?.error ? (
          <p className="py-10 text-center text-[13px] text-red-600">Couldn’t load sites: {list.error}</p>
        ) : !list || list.sites.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-gray-500">
            {tab === "mine"
              ? signedIn
                ? "You haven’t built anything yet. Type an idea in the address bar!"
                : "Sign in to see the sites you built."
              : "No sites here yet. Be the first. Type an idea in the address bar!"}
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {list.sites.map((site, i) => (
              <li key={site.id} className="flex items-stretch gap-3 rounded-xl border border-black/[0.07] bg-white p-3 shadow-sm transition hover:shadow-md">
                <SiteVote site={site} myVote={list.myVotes[site.id] ?? 0} userId={list.userId} onChange={updateSite} />
                <button type="button" onClick={() => onOpen(site.slug)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                  <Favicon slug={site.slug} />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      {tab === "trending" && i === 0 && <span className="shrink-0 whitespace-nowrap rounded bg-orange-100 px-1 text-[10px] font-semibold text-orange-700">#1 THIS WEEK</span>}
                      <span className="truncate text-[13px] font-semibold text-gray-900">{site.title}</span>
                    </span>
                    <span className="block truncate text-[11px] text-[#007aff]">{site.slug}</span>
                    {site.description && <span className="mt-0.5 line-clamp-2 block text-[12px] text-gray-500">{site.description}</span>}
                    <span className="mt-1 block text-[11px] text-gray-400">
                      {site.author_name ?? "a student"} · {timeAgo(site.created_at)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Favicon({ slug }: { slug: string }) {
  let hash = 0;
  for (const ch of slug) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  const hue = Math.abs(hash) % 360;
  return (
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[18px] font-bold uppercase text-white shadow-sm"
      style={{ background: `linear-gradient(135deg, hsl(${hue} 80% 60%), hsl(${(hue + 40) % 360} 75% 45%))` }}
    >
      {slug[0]}
    </span>
  );
}

function timeAgo(iso: string) {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 86400 * 7) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

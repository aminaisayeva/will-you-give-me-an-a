"use client";

import { Shuffle, Sparkles, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAccount } from "@/components/os/AccountContext";
import SiteVote from "@/components/safari/SiteVote";
import { Centered, Favicon, timeAgo } from "@/components/safari/util";
import { listSites, randomSiteSlug, type SiteList, type SiteTab } from "@/app/actions/sites";
import { MAX_PROMPT, type SiteSummary } from "@/lib/sites";

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

// websitemaker.com, the hidden easter egg: describe any website (or type an
// address that doesn't exist yet) and Gemini builds it. Everyone can visit
// and vote on what others made.
export default function WebsiteMaker({ onOpen }: { onOpen: (slug: string) => void }) {
  const account = useAccount();
  const [idea, setIdea] = useState("");
  const [building, setBuilding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const build = async (raw: string) => {
    const input = raw.trim().slice(0, MAX_PROMPT);
    if (!input || building) return;
    setError(null);
    setBuilding(input);
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const data = (await res.json().catch(() => ({}))) as { slug?: string; error?: string };
      if (!res.ok || !data.slug) {
        setError(data.error ?? "Couldn't build that site.");
        return;
      }
      setRefreshKey((k) => k + 1);
      onOpen(data.slug);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBuilding(null);
    }
  };

  const lucky = async () => {
    const slug = await randomSiteSlug();
    if (slug) onOpen(slug);
  };

  if (building) return <Building input={building} />;

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-[#f4f1ff] via-white to-white text-gray-900">
      <div className="mx-auto max-w-3xl px-5 py-8">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#5856d6]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#5856d6]">
            <Wand2 className="h-3 w-3" /> websitemaker.com
          </span>
          <h1 className="mt-3 text-[28px] font-bold tracking-tight">Build any website.</h1>
          <p className="mx-auto mt-1 max-w-md text-[13px] text-gray-500">
            Describe a site, or name an address that doesn’t exist yet, and AI builds it. Then everyone can visit it and vote.
          </p>
        </div>

        {account ? (
          <form
            className="mx-auto mt-5 flex max-w-xl gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void build(idea);
            }}
          >
            <input
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              maxLength={MAX_PROMPT}
              placeholder="e.g. bodega-cats.nyc, or “a Yelp for library study spots”"
              aria-label="Describe a website to build"
              className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[14px] shadow-sm outline-none focus:border-[#5856d6] focus:ring-[3px] focus:ring-[#5856d6]/20"
            />
            <button
              type="submit"
              disabled={!idea.trim()}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#5856d6] px-4 text-[14px] font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" /> Build
            </button>
          </form>
        ) : (
          <p className="mt-5 text-center text-[13px] text-gray-500">
            <a href="/login" className="font-medium text-[#5856d6] hover:underline">Sign in</a> to build sites and vote. You can still browse.
          </p>
        )}
        {error && <p role="alert" className="mt-2 text-center text-[13px] text-red-600">{error}</p>}

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {account &&
            SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void build(s)}
                className="max-w-full truncate rounded-full border border-black/10 bg-white px-3 py-1 text-[12px] text-gray-700 shadow-sm hover:border-[#5856d6] hover:text-[#5856d6]"
              >
                {s}
              </button>
            ))}
          <button type="button" onClick={lucky} className="flex items-center gap-1 rounded-full bg-gray-900 px-3 py-1 text-[12px] font-medium text-white shadow-sm hover:bg-gray-700">
            <Shuffle className="h-3 w-3" /> I’m Feeling Lucky
          </button>
        </div>

        <div className="mt-8">
          <Gallery onOpen={onOpen} signedIn={!!account} refreshKey={refreshKey} />
        </div>
      </div>
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
      <p className="text-[11px] text-gray-400">Gemini usually takes 20–60 seconds. Busy times can take longer.</p>
    </div>
  );
}

function Gallery({ onOpen, signedIn, refreshKey }: { onOpen: (slug: string) => void; signedIn: boolean; refreshKey: number }) {
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
  }, [tab, refreshKey]);

  const updateSite = (site: SiteSummary, myVote: 1 | -1 | 0) =>
    setList((l) => {
      if (!l) return l;
      const myVotes = { ...l.myVotes };
      if (myVote) myVotes[site.id] = myVote;
      else delete myVotes[site.id];
      return { ...l, sites: l.sites.map((s) => (s.id === site.id ? site : s)), myVotes };
    });

  return (
    <div>
        <div className="flex gap-1 overflow-x-auto border-b border-black/10">
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
                ? "You haven’t built anything yet. Describe a site above!"
                : "Sign in to see the sites you built."
              : "No sites here yet. Be the first. Describe one above!"}
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
  );
}


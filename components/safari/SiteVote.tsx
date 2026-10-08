"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState, useTransition } from "react";
import { voteOnSite } from "@/app/actions/sites";
import type { SiteSummary } from "@/lib/sites";

// Reddit-style up/down arrows with the site's score. Guests and authors see
// the score but can't vote.
export default function SiteVote({
  site,
  myVote,
  userId,
  onChange,
}: {
  site: SiteSummary;
  myVote: 1 | -1 | 0;
  userId: string | null;
  onChange: (site: SiteSummary, myVote: 1 | -1 | 0) => void;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const mine = userId === site.author_id;
  const disabledReason = !userId ? "Sign in to vote" : mine ? "You can't vote on your own site" : null;

  const vote = (value: 1 | -1) => {
    if (disabledReason) {
      setError(disabledReason);
      window.setTimeout(() => setError(null), 2000);
      return;
    }
    const next = myVote === value ? 0 : value;
    start(async () => {
      const res = await voteOnSite(site.id, next);
      if (res.ok && res.site) {
        setError(null);
        onChange(res.site, res.myVote);
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className="relative flex shrink-0 flex-col items-center justify-center" title={disabledReason ?? undefined}>
      <button
        type="button"
        onClick={() => vote(1)}
        disabled={pending}
        aria-label="Upvote"
        aria-pressed={myVote === 1}
        className={`rounded p-0.5 ${myVote === 1 ? "text-orange-500" : "text-gray-400 hover:text-orange-500"} ${disabledReason ? "cursor-not-allowed" : ""}`}
      >
        <ChevronUp className="h-5 w-5" strokeWidth={2.5} />
      </button>
      <span
        className={`min-w-[2ch] text-center text-[13px] font-bold tabular-nums ${
          myVote === 1 ? "text-orange-500" : myVote === -1 ? "text-indigo-500" : "text-gray-700"
        } ${pending ? "opacity-50" : ""}`}
        aria-label={`Score ${site.score}`}
      >
        {site.score}
      </span>
      <button
        type="button"
        onClick={() => vote(-1)}
        disabled={pending}
        aria-label="Downvote"
        aria-pressed={myVote === -1}
        className={`rounded p-0.5 ${myVote === -1 ? "text-indigo-500" : "text-gray-400 hover:text-indigo-500"} ${disabledReason ? "cursor-not-allowed" : ""}`}
      >
        <ChevronDown className="h-5 w-5" strokeWidth={2.5} />
      </button>
      {error && (
        <span className="absolute left-full top-1/2 z-20 ml-1 -translate-y-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-[11px] text-white shadow">
          {error}
        </span>
      )}
    </div>
  );
}

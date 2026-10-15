"use client";

import { Flame, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAccount } from "@/components/os/AccountContext";
import Composer, { type ComposerHandle } from "@/components/safari/cooked/Composer";
import PostCard from "@/components/safari/cooked/PostCard";
import { focusRing, setWelcomed, useWelcomed } from "@/components/safari/cooked/shared";
import Welcome from "@/components/safari/cooked/Welcome";
import { cookOfTheDay, getPhoto, listPhotos, type CookOfTheDay, type Feed, type FeedTab } from "@/app/actions/cooked";
import { photoUrl, STYLE_EMOJI, type Caption } from "@/lib/cooked";

const TABS: { id: FeedTab; label: string; about: string }[] = [
  { id: "hot", label: "Hot", about: "Getting votes right now (from the past week)." },
  { id: "new", label: "New", about: "The newest posts first." },
  { id: "top", label: "Top", about: "The highest-voted posts of all time." },
  { id: "mine", label: "My pics", about: "Everything you’ve posted." },
];

// cooked.ai: post a pic, AI writes captions in four voices, everyone votes.
export default function Cooked() {
  const account = useAccount();
  const welcomed = useWelcomed();
  const [tab, setTab] = useState<FeedTab>("hot");
  const [feed, setFeed] = useState<Feed | null>(null);
  const [loading, setLoading] = useState(true);
  const [daily, setDaily] = useState<CookOfTheDay>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [fresh, setFresh] = useState<string | null>(null);
  const composerRef = useRef<ComposerHandle>(null);

  useEffect(() => {
    if (!welcomed) return;
    let cancelled = false;
    Promise.all([listPhotos(tab), cookOfTheDay()]).then(([result, top]) => {
      if (cancelled) return;
      setFeed(result);
      setDaily(top);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [tab, refreshKey, welcomed]);

  useEffect(() => {
    if (!fresh) return;
    document.getElementById(`post-${fresh}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [fresh]);

  if (!welcomed) {
    return (
      <Welcome
        signedIn={!!account}
        onBrowse={() => setWelcomed(true)}
        onPost={() => {
          setWelcomed(true);
          // The composer mounts on the next frame.
          window.requestAnimationFrame(() => composerRef.current?.pick());
        }}
      />
    );
  }

  const current = TABS.find((t) => t.id === tab)!;

  const switchTab = (next: FeedTab) => {
    if (next === tab) return;
    setLoading(true);
    setTab(next);
  };

  const onPosted = async (id: string) => {
    const { post, myVotes } = await getPhoto(id);
    if (!post) return;
    setFeed((f) =>
      f
        ? { ...f, posts: [post, ...f.posts.filter((p) => p.id !== id)], myVotes: { ...f.myVotes, ...myVotes } }
        : { posts: [post], myVotes, userId: account?.id ?? null, error: null },
    );
    setFresh(id);
  };

  const updateCaption = (caption: Caption, myVote: 1 | -1 | 0) =>
    setFeed((f) => {
      if (!f) return f;
      const myVotes = { ...f.myVotes };
      if (myVote) myVotes[caption.id] = myVote;
      else delete myVotes[caption.id];
      const posts = f.posts.map((p) =>
        p.id === caption.photo_id ? { ...p, captions: p.captions.map((c) => (c.id === caption.id ? caption : c)) } : p,
      );
      return { ...f, posts, myVotes };
    });

  return (
    <div className="@container h-full overflow-y-auto scroll-smooth bg-[#fbf7f2] text-stone-900">
      {/* Site header */}
      <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-[#fbf7f2]/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-2.5">
          <span className="flex items-center gap-2 text-[19px] font-extrabold tracking-[-0.02em]">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-600 text-white">
              <Flame className="h-4 w-4" />
            </span>
            <span>
              cooked<span className="text-orange-600">.ai</span>
            </span>
          </span>

          <nav aria-label="Feed" className="ml-2 hidden rounded-xl bg-stone-200/70 p-0.5 @xl:flex">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => switchTab(t.id)}
                aria-current={tab === t.id ? "page" : undefined}
                className={`rounded-[10px] px-3 py-1 text-[13px] font-semibold transition ${focusRing} ${
                  tab === t.id ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => setWelcomed(false)}
              className={`hidden rounded text-[13px] font-medium text-stone-600 underline-offset-4 hover:text-stone-900 hover:underline @md:block ${focusRing}`}
            >
              How it works
            </button>
            {account ? (
              <button
                type="button"
                onClick={() => composerRef.current?.pick()}
                className={`flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-[13px] font-semibold text-white transition hover:bg-orange-700 active:translate-y-px ${focusRing}`}
              >
                <Plus className="h-4 w-4" /> Post a pic
              </button>
            ) : (
              <a href="/login" className={`rounded-lg bg-stone-900 px-3 py-1.5 text-[13px] font-semibold text-white transition hover:bg-stone-700 ${focusRing}`}>
                Sign in
              </a>
            )}
          </div>
        </div>

        {/* Tabs on narrow windows */}
        <nav aria-label="Feed" className="mx-auto flex max-w-4xl gap-1 px-4 pb-2 @xl:hidden">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => switchTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`flex-1 rounded-lg px-2 py-1 text-[13px] font-semibold ${focusRing} ${tab === t.id ? "bg-stone-900 text-white" : "bg-stone-200/70 text-stone-700"}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-14 pt-5">
        {daily && <DailyBanner daily={daily} onOpen={() => setFresh(daily.post.id)} />}

        <div className="mt-4">
          <Composer ref={composerRef} signedIn={!!account} onPosted={onPosted} />
        </div>

        <div className="mt-7 flex items-baseline justify-between gap-3">
          <h2 className="text-[18px] font-bold tracking-tight">{current.label}</h2>
          <p className="text-right text-[12.5px] text-stone-500">{current.about}</p>
        </div>

        {loading ? (
          <FeedSkeleton />
        ) : feed?.error ? (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-[14px] text-red-700">
            We couldn’t load the feed. {feed.error}
            <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={`ml-2 rounded font-semibold underline ${focusRing}`}>
              Try again
            </button>
          </p>
        ) : !feed || feed.posts.length === 0 ? (
          <EmptyFeed tab={tab} signedIn={!!account} onPost={() => composerRef.current?.pick()} onBrowse={() => switchTab("new")} />
        ) : (
          <ol className="mt-4 flex flex-col gap-5">
            {feed.posts.map((post, i) => (
              <li key={post.id} id={`post-${post.id}`} className="scroll-mt-28">
                <PostCard
                  post={post}
                  myVotes={feed.myVotes}
                  userId={feed.userId}
                  fresh={post.id === fresh}
                  rank={tab === "top" || tab === "hot" ? i + 1 : undefined}
                  onVoted={updateCaption}
                  onDeleted={() => setRefreshKey((k) => k + 1)}
                />
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  );
}

function DailyBanner({ daily, onOpen }: { daily: NonNullable<CookOfTheDay>; onOpen: () => void }) {
  return (
    <section aria-label="Cook of the day" className="flex items-center gap-4 overflow-hidden rounded-2xl bg-stone-900 p-3 pr-4 text-white">
      {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL */}
      <img src={photoUrl(daily.post.image_path)} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-orange-300">Cook of the day</p>
        <p className="line-clamp-2 text-[15px] font-semibold leading-snug">“{daily.caption.text}”</p>
        <p className="text-[12px] text-stone-400">
          {STYLE_EMOJI[daily.caption.style]} {daily.caption.style} · {daily.caption.score} {daily.caption.score === 1 ? "vote" : "votes"} · the most upvoted caption in the last 24 hours
        </p>
      </div>
      <button type="button" onClick={onOpen} className={`hidden shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-[12.5px] font-semibold hover:bg-white/20 @xl:block ${focusRing}`}>
        See the post
      </button>
    </section>
  );
}

function FeedSkeleton() {
  return (
    <div className="mt-4 flex flex-col gap-5" aria-busy="true" aria-label="Loading posts">
      {[0, 1].map((i) => (
        <div key={i} className="grid animate-pulse overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200 @2xl:grid-cols-[0.9fr_1.1fr]">
          <div className="h-56 bg-stone-200/70" />
          <div className="space-y-2.5 p-5">
            <div className="h-3 w-1/3 rounded bg-stone-200" />
            {[0, 1, 2, 3].map((j) => (
              <div key={j} className="h-12 rounded-xl bg-stone-100" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyFeed({ tab, signedIn, onPost, onBrowse }: { tab: FeedTab; signedIn: boolean; onPost: () => void; onBrowse: () => void }) {
  const copy =
    tab === "mine"
      ? signedIn
        ? { title: "You haven’t posted yet", text: "Post a photo and see what the four voices have to say about it." }
        : { title: "Sign in to see your pics", text: "Your posts show up here once you have an account." }
      : tab === "hot"
        ? { title: "Nothing hot this week", text: "Be the first to post, or check the newest posts." }
        : { title: "No posts yet", text: "Be the first one to get cooked." };
  return (
    <div className="mt-4 rounded-2xl border-2 border-dashed border-stone-300 px-6 py-12 text-center">
      <p className="text-[16px] font-semibold">{copy.title}</p>
      <p className="mx-auto mt-1 max-w-sm text-[13.5px] text-stone-600">{copy.text}</p>
      <div className="mt-4 flex justify-center gap-4">
        {signedIn ? (
          <button type="button" onClick={onPost} className={`rounded-lg bg-orange-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-orange-700 ${focusRing}`}>
            Post a pic
          </button>
        ) : (
          <a href="/login" className={`rounded-lg bg-stone-900 px-4 py-2 text-[13px] font-semibold text-white hover:bg-stone-700 ${focusRing}`}>
            Sign in to post
          </a>
        )}
        {tab === "hot" && (
          <button type="button" onClick={onBrowse} className={`rounded text-[13px] font-medium text-stone-700 underline-offset-4 hover:underline ${focusRing}`}>
            See new posts
          </button>
        )}
      </div>
    </div>
  );
}

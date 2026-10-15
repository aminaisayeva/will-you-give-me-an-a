"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DailyBanner, EmptyFeed, FeedSkeleton, TABS } from "@/components/safari/Cooked";
import { CookedAccountProvider, type AuthMode } from "@/components/safari/cooked/account";
import Composer, { type ComposerHandle } from "@/components/safari/cooked/Composer";
import PostCard from "@/components/safari/cooked/PostCard";
import { focusRing } from "@/components/safari/cooked/shared";
import { cookOfTheDay, getPhoto, listPhotos, type CookOfTheDay, type Feed as FeedData, type FeedTab } from "@/app/actions/cooked";
import type { MyCookedAccount } from "@/app/actions/cooked-account";
import type { Caption } from "@/lib/cooked";

const ROUTES: Record<AuthMode, string> = { signup: "/signup", login: "/login", profile: "/onboarding", edit: "/profile" };

// The cooked.ai feed: post a pic, vote on captions.
export default function Feed({ me }: { me: MyCookedAccount }) {
  const router = useRouter();
  const [tab, setTab] = useState<FeedTab>("hot");
  const [feed, setFeed] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [daily, setDaily] = useState<CookOfTheDay>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [fresh, setFresh] = useState<string | null>(null);
  const composerRef = useRef<ComposerHandle>(null);
  const hasProfile = Boolean(me.profile);
  const openAuth = (mode: AuthMode) => router.push(ROUTES[mode]);

  useEffect(() => {
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
  }, [tab, refreshKey]);

  useEffect(() => {
    if (!fresh) return;
    document.getElementById(`post-${fresh}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [fresh]);

  const switchTab = (next: FeedTab) => {
    if (next === tab) return;
    setLoading(true);
    setTab(next);
  };

  const startPost = () => {
    if (!me.signedIn) openAuth("signup");
    else if (!hasProfile) openAuth("profile");
    else composerRef.current?.pick();
  };

  const onPosted = async (id: string) => {
    const { post, myVotes } = await getPhoto(id);
    if (!post) return;
    setFeed((f) =>
      f
        ? { ...f, posts: [post, ...f.posts.filter((p) => p.id !== id)], myVotes: { ...f.myVotes, ...myVotes } }
        : { posts: [post], myVotes, userId: me.profile?.user_id ?? null, error: null },
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

  const current = TABS.find((t) => t.id === tab)!;

  return (
    <CookedAccountProvider value={{ me, openAuth }}>
      <main className="@container mx-auto max-w-4xl px-4 pb-16 pt-6">
        {daily && <DailyBanner daily={daily} onOpen={() => setFresh(daily.post.id)} />}

        <div id="post" className="mt-4 scroll-mt-24">
          <Composer ref={composerRef} signedIn={me.signedIn} hasProfile={hasProfile} onNeedAccount={startPost} onPosted={onPosted} />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Sort posts" className="flex rounded-xl bg-stone-200/70 p-0.5">
            {TABS.filter((t) => t.id !== "mine" || me.signedIn).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => switchTab(t.id)}
                aria-current={tab === t.id ? "page" : undefined}
                className={`rounded-[10px] px-3.5 py-1.5 text-[13.5px] font-semibold transition ${focusRing} ${
                  tab === t.id ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <p className="text-[13px] text-stone-500">{current.about}</p>
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
          <EmptyFeed tab={tab} signedIn={me.signedIn} onPost={startPost} onBrowse={() => switchTab("new")} />
        ) : (
          <ol className="mt-4 flex flex-col gap-5">
            {feed.posts.map((post, i) => (
              <li key={post.id} id={`post-${post.id}`} className="scroll-mt-24">
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
    </CookedAccountProvider>
  );
}

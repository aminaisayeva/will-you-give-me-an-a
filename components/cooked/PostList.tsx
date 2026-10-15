"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CookedAccountProvider, type AuthMode } from "@/components/safari/cooked/account";
import PostCard from "@/components/safari/cooked/PostCard";
import type { Feed } from "@/app/actions/cooked";
import type { MyCookedAccount } from "@/app/actions/cooked-account";
import type { Caption } from "@/lib/cooked";

const ROUTES: Record<AuthMode, string> = { signup: "/signup", login: "/login", profile: "/onboarding", edit: "/profile" };

// A list of posts you can vote on, outside the main feed (e.g. a profile page).
export default function PostList({ me, initial, empty }: { me: MyCookedAccount; initial: Feed; empty: string }) {
  const router = useRouter();
  const [feed, setFeed] = useState(initial);

  const updateCaption = (caption: Caption, myVote: 1 | -1 | 0) =>
    setFeed((f) => {
      const myVotes = { ...f.myVotes };
      if (myVote) myVotes[caption.id] = myVote;
      else delete myVotes[caption.id];
      const posts = f.posts.map((p) =>
        p.id === caption.photo_id ? { ...p, captions: p.captions.map((c) => (c.id === caption.id ? caption : c)) } : p,
      );
      return { ...f, posts, myVotes };
    });

  if (feed.posts.length === 0) return <p className="mt-6 rounded-2xl bg-white p-8 text-center text-[14px] text-stone-500 ring-1 ring-stone-200">{empty}</p>;

  return (
    <CookedAccountProvider value={{ me, openAuth: (mode) => router.push(ROUTES[mode]) }}>
      <ol className="@container mt-6 flex flex-col gap-5">
        {feed.posts.map((post) => (
          <li key={post.id}>
            <PostCard
              post={post}
              myVotes={feed.myVotes}
              userId={feed.userId}
              fresh={false}
              onVoted={updateCaption}
              onDeleted={() => setFeed((f) => ({ ...f, posts: f.posts.filter((p) => p.id !== post.id) }))}
            />
          </li>
        ))}
      </ol>
    </CookedAccountProvider>
  );
}

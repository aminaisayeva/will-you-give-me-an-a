import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/Avatar";
import PostList from "@/components/cooked/PostList";
import { profilePage } from "@/app/actions/cooked";
import { getCookedSession } from "@/lib/cooked-session";
import { avatarUrl } from "@/lib/supabase";

export async function generateMetadata({ params }: PageProps<"/u/[username]">): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username.toLowerCase()}` };
}

// Someone's public cooked.ai profile: who they are and what they've posted.
export default async function UserPage({ params }: PageProps<"/u/[username]">) {
  const { username } = await params;
  const [page, session] = await Promise.all([profilePage(username), getCookedSession()]);
  if (!page) notFound();
  const { profile, feed, totalScore } = page;
  const isMe = session?.userId === profile.user_id;
  const joined = new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <main className="mx-auto max-w-4xl px-4 pb-16 pt-8">
      <section className="flex flex-wrap items-center gap-5 rounded-3xl bg-white p-6 ring-1 ring-stone-200">
        <Avatar src={avatarUrl(profile.avatar_path)} name={profile.display_name} size={84} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[26px] font-extrabold tracking-[-0.02em] text-stone-900">{profile.display_name}</h1>
          <p className="text-[14.5px] text-stone-500">@{profile.username} · cooking since {joined}</p>
          <dl className="mt-3 flex gap-6 text-[13.5px]">
            <div>
              <dt className="text-stone-500">Posts</dt>
              <dd className="font-bold tabular-nums text-stone-900">{feed.posts.length}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Caption votes</dt>
              <dd className="font-bold tabular-nums text-stone-900">{totalScore}</dd>
            </div>
          </dl>
        </div>
        {isMe && (
          <Link href="/profile" className="rounded-xl bg-stone-100 px-4 py-2 text-[13.5px] font-semibold text-stone-800 transition hover:bg-stone-200">
            Edit profile
          </Link>
        )}
      </section>

      <h2 className="mt-10 text-[18px] font-bold text-stone-900">{isMe ? "Your posts" : "Posts"}</h2>
      <PostList
        me={{ signedIn: Boolean(session), profile: session?.profile ?? null, suggestedUsername: "", suggestedName: "" }}
        initial={feed}
        empty={isMe ? "You haven't posted yet. Head to the feed and post a pic." : `@${profile.username} hasn't posted yet.`}
      />
    </main>
  );
}

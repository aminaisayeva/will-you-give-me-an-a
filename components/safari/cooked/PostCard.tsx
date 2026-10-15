"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState, useTransition } from "react";
import Avatar from "@/components/Avatar";
import { avatarUrl } from "@/lib/supabase";
import { useCookedAccount } from "./account";
import PromptPanel from "@/components/safari/PromptPanel";
import { timeAgo } from "@/components/safari/util";
import { deletePhoto, voteOnCaption } from "@/app/actions/cooked";
import { getPhotoPrompt } from "@/app/actions/prompts";
import { photoUrl, STYLE_EMOJI, type Caption, type PhotoPost } from "@/lib/cooked";
import { focusRing } from "./shared";

export default function PostCard({
  post,
  myVotes,
  userId,
  fresh,
  rank,
  onVoted,
  onDeleted,
}: {
  post: PhotoPost;
  myVotes: Record<string, 1 | -1>;
  userId: string | null;
  fresh: boolean;
  rank?: number;
  onVoted: (caption: Caption, myVote: 1 | -1 | 0) => void;
  onDeleted: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const mine = userId === post.author_id;
  const best = post.captions.reduce<Caption | null>((top, c) => (c.score > 0 && (!top || c.score > top.score) ? c : top), null);

  return (
    <article
      aria-label={`Post by ${post.author_name ?? "a student"}`}
      className={`@container overflow-hidden rounded-2xl bg-white shadow-[0_12px_30px_-18px_rgba(120,53,15,0.35)] ring-1 transition ${
        fresh ? "ring-2 ring-orange-500" : "ring-stone-200"
      }`}
      style={fresh ? { animation: "dialog-pop 0.35s ease" } : undefined}
    >
      <div className="grid @2xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {/* Photo, shown whole (no cropping) */}
        <div className="relative self-start bg-stone-100 @2xl:m-4 @2xl:mr-0 @2xl:overflow-hidden @2xl:rounded-xl">
          {rank !== undefined && (
            <span className="absolute left-3 top-3 z-[1] rounded-md bg-stone-900/80 px-2 py-0.5 text-[12px] font-bold text-white tabular-nums">#{rank}</span>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL */}
          <img
            src={photoUrl(post.image_path)}
            alt={post.prompt ? `Photo: ${post.prompt}` : `Photo posted by ${post.author_name ?? "a student"}`}
            loading="lazy"
            className="mx-auto block max-h-[22rem] w-full object-contain @2xl:max-h-[28rem]"
          />
        </div>

        <div className="flex min-w-0 flex-col p-4 @2xl:p-5">
          <header>
            <div className="flex items-center gap-2.5">
              <Avatar
                src={post.author ? avatarUrl(post.author.avatar_path) : null}
                name={post.author?.display_name ?? post.author_name ?? "?"}
                size={32}
              />
              <p className="min-w-0 text-[13px] leading-tight text-stone-500">
                <span className="block truncate font-semibold text-stone-900">{post.author?.display_name ?? post.author_name ?? "a student"}</span>
                <span className="block truncate">
                  {post.author ? `@${post.author.username} · ` : ""}
                  {timeAgo(post.created_at)}
                </span>
              </p>
            </div>
            {post.prompt && <p className="mt-1 text-[14px] text-stone-700">“{post.prompt}”</p>}
          </header>

          <ul className="mt-3 flex flex-col gap-2" aria-label="Captions">
            {post.captions.map((caption) => (
              <CaptionRow
                key={caption.id}
                caption={caption}
                best={caption.id === best?.id}
                myVote={myVotes[caption.id] ?? 0}
                userId={userId}
                mine={mine}
                onChange={onVoted}
              />
            ))}
          </ul>

          <footer className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 text-[12.5px]">
            <button
              type="button"
              onClick={() => setShowPrompt((v) => !v)}
              aria-expanded={showPrompt}
              className={`rounded font-medium text-stone-600 underline-offset-4 hover:text-stone-900 hover:underline ${focusRing}`}
            >
              {showPrompt ? "Hide the prompt" : "See the prompt"}
            </button>
            {mine &&
              (confirmDelete ? (
                <span className="flex items-center gap-2">
                  <span className="text-stone-600">Delete this post?</span>
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await deletePhoto(post.id);
                      if (res.ok) onDeleted();
                    }}
                    className={`rounded-md bg-red-600 px-2 py-0.5 font-semibold text-white hover:bg-red-700 ${focusRing}`}
                  >
                    Delete
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className={`rounded font-medium text-stone-600 hover:text-stone-900 ${focusRing}`}>
                    Cancel
                  </button>
                </span>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(true)} className={`rounded font-medium text-stone-500 hover:text-red-700 ${focusRing}`}>
                  Delete post
                </button>
              ))}
          </footer>

          {showPrompt && (
            <div className="mt-3 rounded-xl bg-stone-50 p-3 ring-1 ring-stone-200">
              <PromptPanel load={() => getPhotoPrompt(post.id)} who={post.author_name ?? "The uploader"} />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function CaptionRow({
  caption,
  best,
  myVote,
  userId,
  mine,
  onChange,
}: {
  caption: Caption;
  best: boolean;
  myVote: 1 | -1 | 0;
  userId: string | null;
  mine: boolean;
  onChange: (caption: Caption, myVote: 1 | -1 | 0) => void;
}) {
  const [pending, start] = useTransition();
  const [note, setNote] = useState<"signin" | "own" | "profile" | string | null>(null);
  const { me, openAuth } = useCookedAccount();

  const vote = (value: 1 | -1) => {
    if (!userId) return setNote("signin");
    if (mine) return setNote("own");
    if (me && !me.profile) return setNote("profile");
    const next = myVote === value ? 0 : value;
    start(async () => {
      const res = await voteOnCaption(caption.id, next);
      if (res.ok && res.caption) {
        setNote(null);
        onChange(res.caption, res.myVote);
      } else setNote(res.error ?? "Your vote didn’t go through. Try again.");
    });
  };

  const arrow = `flex h-8 w-8 items-center justify-center rounded-lg transition active:scale-95 disabled:opacity-50 ${focusRing}`;

  return (
    <li
      className={`rounded-xl px-3 py-2.5 transition ${
        best ? "bg-orange-50 ring-1 ring-orange-300" : "bg-stone-50 ring-1 ring-transparent hover:ring-stone-200"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-stone-500">
            <span aria-hidden="true">{STYLE_EMOJI[caption.style] ?? "\u{1F525}"}</span>
            {caption.style}
            {best && <span className="rounded-sm bg-orange-600 px-1.5 text-[10px] font-bold tracking-wide text-white">COOKED</span>}
          </p>
          <p className="mt-0.5 text-[15px] leading-snug text-stone-900">{caption.text}</p>
        </div>

        <div className="flex shrink-0 items-center rounded-xl bg-white p-0.5 ring-1 ring-stone-200" role="group" aria-label="Vote on this caption">
          <button
            type="button"
            onClick={() => vote(1)}
            disabled={pending}
            aria-label="Upvote"
            aria-pressed={myVote === 1}
            title={myVote === 1 ? "Take back your upvote" : "Upvote: this one cooked"}
            className={`${arrow} ${myVote === 1 ? "bg-orange-600 text-white" : "text-stone-500 hover:bg-orange-50 hover:text-orange-700"}`}
          >
            <ChevronUp className="h-5 w-5" strokeWidth={2.5} />
          </button>
          <span
            className={`min-w-[2.25rem] text-center text-[14px] font-bold tabular-nums ${myVote === 1 ? "text-orange-700" : myVote === -1 ? "text-stone-900" : "text-stone-700"}`}
            aria-label={`Score ${caption.score}`}
          >
            {caption.score}
          </span>
          <button
            type="button"
            onClick={() => vote(-1)}
            disabled={pending}
            aria-label="Downvote"
            aria-pressed={myVote === -1}
            title={myVote === -1 ? "Take back your downvote" : "Downvote"}
            className={`${arrow} ${myVote === -1 ? "bg-stone-800 text-white" : "text-stone-500 hover:bg-stone-100 hover:text-stone-800"}`}
          >
            <ChevronDown className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {note && (
        <p role="status" className="mt-2 flex flex-wrap items-center gap-x-2 text-[12.5px] text-stone-600">
          {note === "signin" ? (
            <>
              Voting needs a free account.
              <button type="button" onClick={() => openAuth("signup")} className={`rounded font-semibold text-orange-700 underline-offset-4 hover:underline ${focusRing}`}>
                Sign up
              </button>
              <button type="button" onClick={() => openAuth("login")} className={`rounded font-semibold text-stone-700 underline-offset-4 hover:underline ${focusRing}`}>
                Log in
              </button>
            </>
          ) : note === "profile" ? (
            <>
              Pick a @username to start voting.
              <button type="button" onClick={() => openAuth("profile")} className={`rounded font-semibold text-orange-700 underline-offset-4 hover:underline ${focusRing}`}>
                Create profile
              </button>
            </>
          ) : note === "own" ? (
            "You can’t vote on captions for your own pic."
          ) : (
            note
          )}
          <button type="button" onClick={() => setNote(null)} className={`ml-auto rounded text-stone-400 hover:text-stone-700 ${focusRing}`}>
            Dismiss
          </button>
        </p>
      )}
    </li>
  );
}

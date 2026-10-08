"use client";

import { ChevronDown, ChevronUp, Flame, ImagePlus, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useAccount } from "@/components/os/AccountContext";
import { Centered, timeAgo } from "@/components/safari/util";
import {
  cookOfTheDay,
  deletePhoto,
  getPhoto,
  listPhotos,
  voteOnCaption,
  type CookOfTheDay,
  type Feed,
  type FeedTab,
} from "@/app/actions/cooked";
import { MAX_CONTEXT, photoUrl, STYLE_EMOJI, type Caption, type PhotoPost } from "@/lib/cooked";

const TABS: { id: FeedTab; label: string }[] = [
  { id: "hot", label: "Hot" },
  { id: "new", label: "New" },
  { id: "top", label: "Top" },
  { id: "mine", label: "My Pics" },
];

const COOKING_STEPS = [
  "Preheating the oven…",
  "Asking a Midwest mom for her honest opinion…",
  "Getting a real New Yorker to look up from their phone…",
  "Scrolling for the perfect reaction…",
  "Letting the tour guide walk backwards into frame…",
];

// Resize in the browser before uploading: smaller files upload faster and
// cost far fewer AI tokens. Returns a JPEG no larger than 1280px.
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("encode"))), "image/jpeg", 0.85),
  );
}

// cooked.ai: upload a pic, AI writes captions in four voices, everyone votes
// on which caption cooked hardest.
export default function Cooked() {
  const account = useAccount();
  const [tab, setTab] = useState<FeedTab>("hot");
  const [feed, setFeed] = useState<Feed | null>(null);
  const [loading, setLoading] = useState(true);
  const [daily, setDaily] = useState<CookOfTheDay>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [highlight, setHighlight] = useState<string | null>(null);

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

  const switchTab = (next: FeedTab) => {
    if (next === tab) return;
    setLoading(true);
    setTab(next);
  };

  // Show a freshly cooked pic at the top of the feed.
  const onPosted = async (id: string) => {
    const { post, myVotes } = await getPhoto(id);
    if (!post) return;
    setHighlight(id);
    setFeed((f) =>
      f
        ? { ...f, posts: [post, ...f.posts.filter((p) => p.id !== id)], myVotes: { ...f.myVotes, ...myVotes } }
        : { posts: [post], myVotes, userId: account?.id ?? null, error: null },
    );
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
    <div className="h-full overflow-y-auto bg-[#fff8f1] text-gray-900">
      {/* Site header */}
      <header className="sticky top-0 z-10 border-b border-orange-200/70 bg-[#fff8f1]/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2.5">
          <span className="flex items-center gap-1.5 text-[20px] font-black tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-red-600 text-white shadow-sm">
              <Flame className="h-4 w-4" />
            </span>
            <span>
              cooked<span className="text-orange-500">.ai</span>
            </span>
          </span>
          <nav className="ml-auto flex gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => switchTab(t.id)}
                className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold ${
                  tab === t.id ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-orange-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pb-10 pt-5">
        <div className="text-center">
          <h1 className="text-[26px] font-black leading-tight tracking-tight sm:text-[30px]">Is your pic cooked?</h1>
          <p className="mt-1 text-[13px] text-gray-600">Upload a photo. AI roasts it four ways. Everyone votes on who cooked hardest.</p>
        </div>

        {daily && <DailyBanner daily={daily} />}

        <Uploader signedIn={!!account} onPosted={onPosted} />

        {loading ? (
          <Centered spinner text="Loading the feed…" />
        ) : feed?.error ? (
          <p className="py-10 text-center text-[13px] text-red-600">Couldn’t load the feed: {feed.error}</p>
        ) : !feed || feed.posts.length === 0 ? (
          <p className="py-12 text-center text-[13px] text-gray-500">
            {tab === "mine" ? (account ? "You haven’t posted a pic yet." : "Sign in to see your pics.") : "Nothing cooking yet. Post the first pic!"}
          </p>
        ) : (
          <ul className="mt-6 flex flex-col gap-5">
            {feed.posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                myVotes={feed.myVotes}
                userId={feed.userId}
                fresh={post.id === highlight}
                onVoted={updateCaption}
                onDeleted={() => setRefreshKey((k) => k + 1)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function DailyBanner({ daily }: { daily: NonNullable<CookOfTheDay> }) {
  return (
    <section className="mt-5 flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 p-3 text-white shadow-md">
      {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL */}
      <img src={photoUrl(daily.post.image_path)} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover ring-2 ring-white/40" />
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-white/80">🔥 Cook of the Day</p>
        <p className="line-clamp-2 text-[14px] font-semibold leading-snug">“{daily.caption.text}”</p>
        <p className="text-[11px] text-white/80">
          {STYLE_EMOJI[daily.caption.style]} {daily.caption.style} · ▲ {daily.caption.score}
        </p>
      </div>
    </section>
  );
}

function Uploader({ signedIn, onPosted }: { signedIn: boolean; onPosted: (id: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [context, setContext] = useState("");
  const [cooking, setCooking] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  useEffect(() => {
    if (!cooking) return;
    const id = window.setInterval(() => setStep((s) => (s + 1) % COOKING_STEPS.length), 2200);
    return () => window.clearInterval(id);
  }, [cooking]);

  if (!signedIn) {
    return (
      <div className="mt-5 rounded-2xl border-2 border-dashed border-orange-300 bg-white/60 p-6 text-center">
        <p className="text-[14px] font-semibold">Want your pic cooked?</p>
        <p className="mt-1 text-[12px] text-gray-500">Sign in to post photos and vote on captions. You can still scroll the feed.</p>
        <a href="/login" className="mt-3 inline-block rounded-full bg-gray-900 px-4 py-1.5 text-[13px] font-semibold text-white hover:bg-gray-700">
          Sign In
        </a>
      </div>
    );
  }

  const pick = async (picked: File | undefined) => {
    setError(null);
    if (!picked) return;
    if (!/^image\/(jpeg|png|webp)$/.test(picked.type)) {
      setError("Use a JPEG, PNG or WebP photo. (iPhone HEIC photos: share them as “Most Compatible”.)");
      return;
    }
    try {
      const small = await shrink(picked);
      setFile(small);
      setPreview(URL.createObjectURL(small));
    } catch {
      setError("Couldn’t read that photo. Try another one.");
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setContext("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const cook = async () => {
    if (!file) return;
    setCooking(true);
    setStep(0);
    setError(null);
    const form = new FormData();
    form.set("image", file, "photo.jpg");
    if (context.trim()) form.set("context", context.trim());
    try {
      const res = await fetch("/api/cooked", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
      if (!res.ok || !data.id) {
        setError(data.error ?? "Couldn’t cook that pic. Try again.");
        return;
      }
      reset();
      onPosted(data.id);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setCooking(false);
    }
  };

  return (
    <section className="mt-5 rounded-2xl border border-orange-200 bg-white p-4 shadow-sm">
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => void pick(e.target.files?.[0])}
      />
      {!preview ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void pick(e.dataTransfer.files?.[0]);
          }}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-orange-300 bg-orange-50/60 px-4 py-8 text-center hover:bg-orange-50"
        >
          <ImagePlus className="h-8 w-8 text-orange-500" />
          <span className="text-[14px] font-semibold">Drop a pic or click to upload</span>
          <span className="text-[12px] text-gray-500">Your dorm, your lunch, your 1 train commute. JPEG, PNG or WebP.</span>
        </button>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
            <img src={preview} alt="Your photo" className="h-40 w-full rounded-xl object-cover sm:w-56" />
            {!cooking && (
              <button type="button" onClick={reset} aria-label="Remove photo" className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-black/80">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <label className="text-[12px] font-semibold text-gray-700" htmlFor="cooked-context">
              What’s the pic? <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              id="cooked-context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              maxLength={MAX_CONTEXT}
              disabled={cooking}
              placeholder="e.g. my first NYC apartment, $2,400/month"
              className="rounded-lg border border-black/10 px-3 py-2 text-[13px] outline-none focus:border-orange-400 focus:ring-[3px] focus:ring-orange-200"
            />
            <button
              type="button"
              onClick={() => void cook()}
              disabled={cooking}
              className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2.5 text-[14px] font-bold text-white shadow-md hover:brightness-110 disabled:opacity-80"
            >
              {cooking ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {COOKING_STEPS[step]}
                </>
              ) : (
                <>
                  <Flame className="h-4 w-4" /> Cook it
                </>
              )}
            </button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-[12px] text-red-600">{error}</p>}
    </section>
  );
}

function PostCard({
  post,
  myVotes,
  userId,
  fresh,
  onVoted,
  onDeleted,
}: {
  post: PhotoPost;
  myVotes: Record<string, 1 | -1>;
  userId: string | null;
  fresh: boolean;
  onVoted: (caption: Caption, myVote: 1 | -1 | 0) => void;
  onDeleted: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const mine = userId === post.author_id;
  const best = post.captions.reduce<Caption | null>((top, c) => (c.score > 0 && (!top || c.score > top.score) ? c : top), null);

  return (
    <li
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${fresh ? "border-orange-400 ring-4 ring-orange-200" : "border-black/[0.07]"}`}
      style={fresh ? { animation: "dialog-pop 0.35s ease" } : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL */}
      <img src={photoUrl(post.image_path)} alt={post.prompt ?? "Uploaded photo"} loading="lazy" className="max-h-[420px] w-full bg-gray-100 object-cover" />
      <div className="p-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-gray-500">
              <span className="font-semibold text-gray-800">{post.author_name ?? "a student"}</span> · {timeAgo(post.created_at)}
            </p>
            {post.prompt && <p className="mt-0.5 text-[13px] italic text-gray-700">“{post.prompt}”</p>}
          </div>
          {mine &&
            (confirmDelete ? (
              <span className="flex shrink-0 items-center gap-1">
                <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-md px-2 py-0.5 text-[12px] text-gray-600 hover:bg-gray-100">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const res = await deletePhoto(post.id);
                    if (res.ok) onDeleted();
                  }}
                  className="rounded-md bg-red-500 px-2 py-0.5 text-[12px] font-medium text-white"
                >
                  Delete
                </button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} aria-label="Delete pic" className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            ))}
        </div>

        <ul className="mt-3 flex flex-col gap-2">
          {post.captions.map((caption) => (
            <li
              key={caption.id}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 ${caption.id === best?.id ? "bg-orange-50 ring-1 ring-orange-300" : "bg-gray-50"}`}
            >
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  <span aria-hidden="true">{STYLE_EMOJI[caption.style] ?? "\u{1F525}"}</span>
                  {caption.style}
                  {caption.id === best?.id && <span className="rounded bg-orange-500 px-1 text-[10px] text-white">COOKED</span>}
                </p>
                <p className="text-[14px] leading-snug text-gray-900">{caption.text}</p>
              </div>
              <CaptionVote caption={caption} myVote={myVotes[caption.id] ?? 0} userId={userId} mine={mine} onChange={onVoted} />
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

function CaptionVote({
  caption,
  myVote,
  userId,
  mine,
  onChange,
}: {
  caption: Caption;
  myVote: 1 | -1 | 0;
  userId: string | null;
  mine: boolean;
  onChange: (caption: Caption, myVote: 1 | -1 | 0) => void;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const disabledReason = !userId ? "Sign in to vote" : mine ? "You can't vote on your own pic" : null;

  const vote = (value: 1 | -1) => {
    if (disabledReason) {
      setError(disabledReason);
      window.setTimeout(() => setError(null), 2000);
      return;
    }
    const next = myVote === value ? 0 : value;
    start(async () => {
      const res = await voteOnCaption(caption.id, next);
      if (res.ok && res.caption) {
        setError(null);
        onChange(res.caption, res.myVote);
      } else setError(res.error);
    });
  };

  return (
    <div className="relative flex shrink-0 flex-col items-center" title={disabledReason ?? undefined}>
      <button
        type="button"
        onClick={() => vote(1)}
        disabled={pending}
        aria-label={`Upvote caption: ${caption.text}`}
        aria-pressed={myVote === 1}
        className={`rounded p-0.5 ${myVote === 1 ? "text-orange-500" : "text-gray-400 hover:text-orange-500"} ${disabledReason ? "cursor-not-allowed" : ""}`}
      >
        <ChevronUp className="h-5 w-5" strokeWidth={2.5} />
      </button>
      <span
        className={`text-[13px] font-bold tabular-nums ${myVote === 1 ? "text-orange-500" : myVote === -1 ? "text-indigo-500" : "text-gray-700"} ${pending ? "opacity-50" : ""}`}
      >
        {caption.score}
      </span>
      <button
        type="button"
        onClick={() => vote(-1)}
        disabled={pending}
        aria-label={`Downvote caption: ${caption.text}`}
        aria-pressed={myVote === -1}
        className={`rounded p-0.5 ${myVote === -1 ? "text-indigo-500" : "text-gray-400 hover:text-indigo-500"} ${disabledReason ? "cursor-not-allowed" : ""}`}
      >
        <ChevronDown className="h-5 w-5" strokeWidth={2.5} />
      </button>
      {error && (
        <span className="absolute right-full top-1/2 z-20 mr-1 -translate-y-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-[11px] text-white shadow">
          {error}
        </span>
      )}
    </div>
  );
}

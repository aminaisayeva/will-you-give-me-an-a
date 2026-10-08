"use server";

import { PHOTO_BUCKET, PHOTO_COLUMNS, type Caption, type PhotoPost } from "@/lib/cooked";
import { createClient } from "@/lib/supabase/server";

export type FeedTab = "hot" | "new" | "top" | "mine";

export type Feed = {
  posts: PhotoPost[];
  myVotes: Record<string, 1 | -1>;
  userId: string | null;
  error: string | null;
};

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function myVotesFor(supabase: Supabase, captionIds: string[]) {
  if (captionIds.length === 0) return {};
  // RLS only returns the signed-in user's own votes.
  const { data } = await supabase.from("caption_votes").select("caption_id, value").in("caption_id", captionIds);
  return Object.fromEntries((data ?? []).map((v) => [v.caption_id, v.value as 1 | -1]));
}

function sortCaptions(post: PhotoPost): PhotoPost {
  return { ...post, captions: [...post.captions].sort((a, b) => a.position - b.position) };
}

// "Hot": votes decay with age, like Hacker News, so new posts get a chance.
function hotness(post: PhotoPost, now: number) {
  const hours = (now - new Date(post.created_at).getTime()) / 3_600_000;
  return (post.score + 1) / Math.pow(hours + 2, 1.5);
}

export async function listPhotos(tab: FeedTab): Promise<Feed> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (tab === "mine" && !user) return { posts: [], myVotes: {}, userId: null, error: null };

  let query = supabase.from("photos").select(PHOTO_COLUMNS);
  if (tab === "top") query = query.order("score", { ascending: false }).order("created_at", { ascending: false }).limit(40);
  else if (tab === "mine") query = query.eq("author_id", user!.id).order("created_at", { ascending: false }).limit(40);
  else if (tab === "hot") {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("created_at", weekAgo).order("created_at", { ascending: false }).limit(100);
  } else query = query.order("created_at", { ascending: false }).limit(40);

  const { data, error } = await query;
  if (error) return { posts: [], myVotes: {}, userId: user?.id ?? null, error: error.message };
  let posts = ((data ?? []) as PhotoPost[]).map(sortCaptions);
  if (tab === "hot") {
    const now = Date.now();
    posts = posts.sort((a, b) => hotness(b, now) - hotness(a, now)).slice(0, 40);
  }
  return {
    posts,
    myVotes: user ? await myVotesFor(supabase, posts.flatMap((p) => p.captions.map((c) => c.id))) : {},
    userId: user?.id ?? null,
    error: null,
  };
}

export async function getPhoto(id: string): Promise<{ post: PhotoPost | null; myVotes: Record<string, 1 | -1> }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase.from("photos").select(PHOTO_COLUMNS).eq("id", id).maybeSingle();
  if (!data) return { post: null, myVotes: {} };
  const post = sortCaptions(data as PhotoPost);
  return { post, myVotes: user ? await myVotesFor(supabase, post.captions.map((c) => c.id)) : {} };
}

export type CookOfTheDay = { caption: Caption; post: PhotoPost } | null;

// The most upvoted caption posted in the last 24 hours.
export async function cookOfTheDay(): Promise<CookOfTheDay> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("captions")
    .select("id, photo_id, style, text, position, upvotes, downvotes, score")
    .gte("created_at", since)
    .gt("score", 0)
    .order("score", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const { post } = await getPhoto(data.photo_id);
  return post ? { caption: data as Caption, post } : null;
}

export type CaptionVoteResult = { ok: boolean; error: string | null; caption: Caption | null; myVote: 1 | -1 | 0 };

// Upvote (1), downvote (-1) or clear (0) your vote on a caption. A new vote is
// a new row in caption_votes; changing it updates that row.
export async function voteOnCaption(captionId: string, value: 1 | -1 | 0): Promise<CaptionVoteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const fail = (error: string): CaptionVoteResult => ({ ok: false, error, caption: null, myVote: 0 });
  if (!user) return fail("Sign in to vote.");
  if (![1, -1, 0].includes(value)) return fail("Invalid vote.");

  const { data: caption } = await supabase.from("captions").select("photo_id, photos(author_id)").eq("id", captionId).maybeSingle();
  if (!caption) return fail("That caption no longer exists.");
  const author = (caption.photos as unknown as { author_id: string } | null)?.author_id;
  if (author === user.id) return fail("You can't vote on your own pic.");

  const { data: existing } = await supabase
    .from("caption_votes")
    .select("value")
    .eq("caption_id", captionId)
    .eq("user_id", user.id)
    .maybeSingle();

  let error;
  if (value === 0) {
    ({ error } = await supabase.from("caption_votes").delete().eq("caption_id", captionId).eq("user_id", user.id));
  } else if (existing) {
    ({ error } = await supabase.from("caption_votes").update({ value }).eq("caption_id", captionId).eq("user_id", user.id));
  } else {
    ({ error } = await supabase.from("caption_votes").insert({ caption_id: captionId, value }));
  }
  if (error) return fail(error.message);

  const { data: fresh } = await supabase
    .from("captions")
    .select("id, photo_id, style, text, position, upvotes, downvotes, score")
    .eq("id", captionId)
    .maybeSingle();
  return { ok: true, error: null, caption: (fresh as Caption | null) ?? null, myVote: value };
}

export async function deletePhoto(photoId: string): Promise<{ ok: boolean; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in first." };
  const { data: photo } = await supabase.from("photos").select("image_path, author_id").eq("id", photoId).maybeSingle();
  if (!photo || photo.author_id !== user.id) return { ok: false, error: "You can only delete your own pics." };
  const { error } = await supabase.from("photos").delete().eq("id", photoId);
  if (error) return { ok: false, error: error.message };
  await supabase.storage.from(PHOTO_BUCKET).remove([photo.image_path]);
  return { ok: true, error: null };
}

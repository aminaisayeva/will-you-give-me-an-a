"use server";

import { isSlug, SITE_SUMMARY_COLUMNS, type SiteSummary } from "@/lib/sites";
import { createClient } from "@/lib/supabase/server";

export type SiteTab = "trending" | "new" | "top" | "mine";

export type SiteList = {
  sites: SiteSummary[];
  myVotes: Record<string, 1 | -1>;
  userId: string | null;
  error: string | null;
};

async function votesFor(supabase: Awaited<ReturnType<typeof createClient>>, ids: string[]) {
  if (ids.length === 0) return {};
  // RLS only returns the signed-in user's own votes.
  const { data } = await supabase.from("site_votes").select("site_id, value").in("site_id", ids);
  return Object.fromEntries((data ?? []).map((v) => [v.site_id, v.value as 1 | -1]));
}

export async function listSites(tab: SiteTab): Promise<SiteList> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (tab === "mine" && !user) return { sites: [], myVotes: {}, userId: null, error: null };

  let query = supabase.from("sites").select(SITE_SUMMARY_COLUMNS).limit(60);
  if (tab === "trending") {
    // Best of the last week, newest first among ties.
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("created_at", weekAgo).order("score", { ascending: false }).order("created_at", { ascending: false });
  } else if (tab === "top") {
    query = query.order("score", { ascending: false }).order("created_at", { ascending: false });
  } else if (tab === "mine") {
    query = query.eq("author_id", user!.id).order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) return { sites: [], myVotes: {}, userId: user?.id ?? null, error: error.message };
  const sites = (data ?? []) as SiteSummary[];
  return {
    sites,
    myVotes: user ? await votesFor(supabase, sites.map((s) => s.id)) : {},
    userId: user?.id ?? null,
    error: null,
  };
}

export type SiteDetail = { site: SiteSummary | null; myVote: 1 | -1 | 0; userId: string | null };

export async function getSite(slug: string): Promise<SiteDetail> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const address = slug.toLowerCase();
  if (!isSlug(address)) return { site: null, myVote: 0, userId: user?.id ?? null };

  const { data } = await supabase.from("sites").select(SITE_SUMMARY_COLUMNS).eq("slug", address).maybeSingle();
  const site = (data as SiteSummary | null) ?? null;
  const votes = user && site ? await votesFor(supabase, [site.id]) : {};
  return { site, myVote: (site && votes[site.id]) || 0, userId: user?.id ?? null };
}

export async function randomSiteSlug(): Promise<string | null> {
  const supabase = await createClient();
  const { count } = await supabase.from("sites").select("id", { count: "exact", head: true });
  if (!count) return null;
  const offset = Math.floor(Math.random() * count);
  const { data } = await supabase.from("sites").select("slug").order("created_at").range(offset, offset);
  return data?.[0]?.slug ?? null;
}

export type VoteResult = { ok: boolean; error: string | null; site: SiteSummary | null; myVote: 1 | -1 | 0 };

// Upvote (1), downvote (-1), or clear (0) your vote on a site. Each new vote is
// a row in site_votes; changing your mind updates that row.
export async function voteOnSite(siteId: string, value: 1 | -1 | 0): Promise<VoteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const fail = (error: string): VoteResult => ({ ok: false, error, site: null, myVote: 0 });
  if (!user) return fail("Sign in to vote.");
  if (![1, -1, 0].includes(value)) return fail("Invalid vote.");

  const { data: site } = await supabase.from("sites").select("author_id").eq("id", siteId).maybeSingle();
  if (!site) return fail("That site no longer exists.");
  if (site.author_id === user.id) return fail("You can't vote on your own site.");

  const { data: existing } = await supabase
    .from("site_votes")
    .select("value")
    .eq("site_id", siteId)
    .eq("user_id", user.id)
    .maybeSingle();

  let error;
  if (value === 0) {
    ({ error } = await supabase.from("site_votes").delete().eq("site_id", siteId).eq("user_id", user.id));
  } else if (existing) {
    ({ error } = await supabase.from("site_votes").update({ value }).eq("site_id", siteId).eq("user_id", user.id));
  } else {
    ({ error } = await supabase.from("site_votes").insert({ site_id: siteId, value }));
  }
  if (error) return fail(error.message);

  const { data: fresh } = await supabase.from("sites").select(SITE_SUMMARY_COLUMNS).eq("id", siteId).maybeSingle();
  return { ok: true, error: null, site: (fresh as SiteSummary | null) ?? null, myVote: value };
}

export async function deleteSite(siteId: string): Promise<{ ok: boolean; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in first." };
  const { error, count } = await supabase.from("sites").delete({ count: "exact" }).eq("id", siteId).eq("author_id", user.id);
  if (error) return { ok: false, error: error.message };
  return { ok: (count ?? 0) > 0, error: count ? null : "You can only delete your own sites." };
}

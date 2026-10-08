-- Assignment 4: AI-generated websites (Safari) and votes, plus strict RLS on
-- every table. Applied as migrations "ai_sites_and_votes" and
-- "strict_rls_emails_profiles".

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  -- The made-up address, e.g. "bodega-cats.nyc". Unique: the generated
  -- "internet" is shared, so visiting an existing address opens that site.
  slug text not null unique check (slug ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$' and char_length(slug) <= 80),
  title text not null check (char_length(title) between 1 and 120),
  description text check (description is null or char_length(description) <= 300),
  -- What the user typed, and the exact instructions sent to the model with it.
  prompt text not null check (char_length(prompt) between 1 and 500),
  system_prompt text not null,
  model text not null,
  html text not null check (octet_length(html) <= 400000),
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  author_name text,
  upvotes integer not null default 0,
  downvotes integer not null default 0,
  score integer generated always as (upvotes - downvotes) stored,
  created_at timestamptz not null default now()
);

create index sites_created_at_idx on public.sites (created_at desc);
create index sites_score_idx on public.sites (score desc, created_at desc);
create index sites_author_idx on public.sites (author_id, created_at desc);

create table public.site_votes (
  site_id uuid not null references public.sites (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (site_id, user_id)
);

create index site_votes_user_idx on public.site_votes (user_id);

-- Stamp the author's display name from their profile, so it can't be faked.
create function public.sites_set_author_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select nullif(trim(concat_ws(' ', p.first_name, p.last_name)), '')
    into new.author_name
    from public.profiles p
   where p.id = new.author_id;
  return new;
end;
$$;

revoke execute on function public.sites_set_author_name() from public, anon, authenticated;

create trigger sites_set_author_name
  before insert on public.sites
  for each row execute function public.sites_set_author_name();

-- Keep the public vote counts in sync. Runs as the table owner, because
-- users can only see their own votes.
create function public.site_votes_recount()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid := coalesce(new.site_id, old.site_id);
begin
  update public.sites s
     set upvotes = (select count(*) from public.site_votes v where v.site_id = target and v.value = 1),
         downvotes = (select count(*) from public.site_votes v where v.site_id = target and v.value = -1)
   where s.id = target;
  return null;
end;
$$;

revoke execute on function public.site_votes_recount() from public, anon, authenticated;

create trigger site_votes_recount
  after insert or update or delete on public.site_votes
  for each row execute function public.site_votes_recount();

create function public.site_votes_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger site_votes_touch
  before update on public.site_votes
  for each row execute function public.site_votes_touch();

alter table public.sites enable row level security;
alter table public.site_votes enable row level security;

-- Anyone, including guests, can browse the generated sites.
create policy "Anyone can read sites"
  on public.sites for select to anon, authenticated using (true);

-- Signed-in users create sites as themselves.
create policy "Signed-in users create their own sites"
  on public.sites for insert to authenticated
  with check (author_id = (select auth.uid()));

-- Authors may delete their own sites. Nobody can edit a site after creation.
create policy "Authors delete their own sites"
  on public.sites for delete to authenticated
  using (author_id = (select auth.uid()));

-- Column privileges: vote counts and the author name are maintained by
-- triggers and can't be written directly.
revoke insert, update, delete on public.sites from anon, authenticated;
grant insert (slug, title, description, prompt, system_prompt, model, html) on public.sites to authenticated;
grant delete on public.sites to authenticated;

-- Votes are private: you only ever see your own.
create policy "Users read their own votes"
  on public.site_votes for select to authenticated
  using (user_id = (select auth.uid()));

-- Vote as yourself, never on your own site.
create policy "Users vote on other people's sites"
  on public.site_votes for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and not exists (
      select 1 from public.sites s
       where s.id = site_id and s.author_id = (select auth.uid())
    )
  );

create policy "Users change their own votes"
  on public.site_votes for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users remove their own votes"
  on public.site_votes for delete to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.site_votes from anon;
revoke insert, update on public.site_votes from authenticated;
grant insert (site_id, value) on public.site_votes to authenticated;
grant update (value) on public.site_votes to authenticated;

-- ---------------------------------------------------------------------------
-- Migration "strict_rls_emails_profiles".

-- Mail: only signed-in users. Everyone shares the seeded inbox; you only see
-- the mail you sent yourself, and you can only send as yourself.
drop policy "Anyone can read emails" on public.emails;
drop policy "Anyone can send emails into the sent folder" on public.emails;

alter table public.emails alter column sender_id set default auth.uid();

create policy "Signed-in users read the inbox and their own sent mail"
  on public.emails for select to authenticated
  using (folder = 'inbox' or sender_id = (select auth.uid()));

create policy "Signed-in users send mail as themselves"
  on public.emails for insert to authenticated
  with check (folder = 'sent' and sender_id = (select auth.uid()));

revoke all on public.emails from anon;
revoke insert, update, delete on public.emails from authenticated;
grant insert (folder, sender_name, sender_email, recipient_email, subject, body) on public.emails to authenticated;

-- Profiles: no guest access; users may only change their name and photo.
revoke all on public.profiles from anon;
revoke insert, update, delete on public.profiles from authenticated;
grant update (first_name, last_name, avatar_path) on public.profiles to authenticated;

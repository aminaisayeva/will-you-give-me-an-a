-- cooked.ai (assignment 4's front door): users upload a photo, Gemini writes
-- captions, everyone votes on captions. Applied as migration "cooked_photo_captions".

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  author_name text,
  -- Path in the "photos" storage bucket ("<user id>/<file>"). Image bytes live in Storage.
  image_path text not null check (char_length(image_path) between 3 and 200),
  -- What the user said about the photo (optional), plus the exact instructions
  -- and model used to write the captions.
  prompt text check (prompt is null or char_length(prompt) <= 140),
  system_prompt text not null,
  model text not null,
  score integer not null default 0,
  created_at timestamptz not null default now(),
  -- Users can only point at files in their own folder.
  constraint photos_own_folder check (split_part(image_path, '/', 1) = author_id::text)
);

create index photos_created_at_idx on public.photos (created_at desc);
create index photos_score_idx on public.photos (score desc, created_at desc);
create index photos_author_idx on public.photos (author_id, created_at desc);

create table public.captions (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos (id) on delete cascade,
  style text not null check (char_length(style) between 1 and 40),
  text text not null check (char_length(text) between 1 and 280),
  position smallint not null default 0,
  upvotes integer not null default 0,
  downvotes integer not null default 0,
  score integer generated always as (upvotes - downvotes) stored,
  created_at timestamptz not null default now()
);

create index captions_photo_idx on public.captions (photo_id, position);
create index captions_score_idx on public.captions (created_at desc, score desc);

create table public.caption_votes (
  caption_id uuid not null references public.captions (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (caption_id, user_id)
);

create index caption_votes_user_idx on public.caption_votes (user_id);

-- Author's display name comes from their profile, so it can't be faked.
create function public.photos_set_author_name()
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

revoke execute on function public.photos_set_author_name() from public, anon, authenticated;

create trigger photos_set_author_name
  before insert on public.photos
  for each row execute function public.photos_set_author_name();

-- Keep caption counts (and the photo's total score) in sync with votes.
create function public.caption_votes_recount()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid := coalesce(new.caption_id, old.caption_id);
  parent uuid;
begin
  update public.captions c
     set upvotes = (select count(*) from public.caption_votes v where v.caption_id = target and v.value = 1),
         downvotes = (select count(*) from public.caption_votes v where v.caption_id = target and v.value = -1)
   where c.id = target
  returning c.photo_id into parent;

  update public.photos p
     set score = coalesce((select sum(c.upvotes - c.downvotes) from public.captions c where c.photo_id = parent), 0)
   where p.id = parent;
  return null;
end;
$$;

revoke execute on function public.caption_votes_recount() from public, anon, authenticated;

create trigger caption_votes_recount
  after insert or update or delete on public.caption_votes
  for each row execute function public.caption_votes_recount();

create trigger caption_votes_touch
  before update on public.caption_votes
  for each row execute function public.site_votes_touch();

-- Row level security -----------------------------------------------------

alter table public.photos enable row level security;
alter table public.captions enable row level security;
alter table public.caption_votes enable row level security;

create policy "Anyone can see photos"
  on public.photos for select to anon, authenticated using (true);

create policy "Signed-in users post their own photos"
  on public.photos for insert to authenticated
  with check (author_id = (select auth.uid()));

create policy "Authors delete their own photos"
  on public.photos for delete to authenticated
  using (author_id = (select auth.uid()));

revoke insert, update, delete on public.photos from anon, authenticated;
grant insert (image_path, prompt, system_prompt, model) on public.photos to authenticated;
grant delete on public.photos to authenticated;

create policy "Anyone can read captions"
  on public.captions for select to anon, authenticated using (true);

-- Captions are written for your own photo, right after you post it.
create policy "Authors add captions to their own photos"
  on public.captions for insert to authenticated
  with check (exists (
    select 1 from public.photos p where p.id = photo_id and p.author_id = (select auth.uid())
  ));

revoke insert, update, delete on public.captions from anon, authenticated;
grant insert (photo_id, style, text, position) on public.captions to authenticated;

-- Votes are private to the voter, and you can't vote on captions of your own photo.
create policy "Users read their own caption votes"
  on public.caption_votes for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users vote on other people's captions"
  on public.caption_votes for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and not exists (
      select 1 from public.captions c join public.photos p on p.id = c.photo_id
       where c.id = caption_id and p.author_id = (select auth.uid())
    )
  );

create policy "Users change their own caption votes"
  on public.caption_votes for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users remove their own caption votes"
  on public.caption_votes for delete to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.caption_votes from anon;
revoke insert, update on public.caption_votes from authenticated;
grant insert (caption_id, value) on public.caption_votes to authenticated;
grant update (value) on public.caption_votes to authenticated;

-- Storage: a public bucket for the uploaded photos; you only write to your own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 4194304, array['image/jpeg', 'image/png', 'image/webp']);

create policy "Users upload their own photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users list their own photos"
  on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users delete their own photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

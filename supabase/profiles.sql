-- Schema for accounts (applied to the Supabase project as migration "create_profiles_and_avatars").
-- One profile row per auth user, created automatically by a trigger on auth.users.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  first_name text check (first_name is null or char_length(first_name) between 1 and 60),
  last_name text check (last_name is null or char_length(last_name) between 1 and 60),
  -- Path of the photo inside the "avatars" storage bucket. The image bytes live
  -- in Storage, never in this table.
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Insert a profile the first time someone signs in. Names start out null so the
-- app can ask the user for them.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Only the trigger should run this, never the public RPC API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Backfill anyone who signed up before this migration.
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select to authenticated using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Mail: remember which signed-in user sent a message (null for older/anonymous rows).
alter table public.emails
  add column sender_id uuid references public.profiles (id) on delete set null;

create index emails_sender_id_idx on public.emails (sender_id);

-- Nobody can claim to be another user when sending.
drop policy "Anyone can send emails into the sent folder" on public.emails;

create policy "Anyone can send emails into the sent folder"
  on public.emails for insert to anon, authenticated
  with check (folder = 'sent' and (sender_id is null or sender_id = (select auth.uid())));

-- Avatars: a public bucket, each user may only write inside a folder named after their id.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 4194304, array['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

create policy "Users can list their own avatar"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can upload their own avatar"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can replace their own avatar"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can delete their own avatar"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------------------------------------------------------------------------
-- Migration "password_support": email/password accounts.

-- Email sign-ups may pass their name in user metadata; Google sign-ups don't,
-- so those users are still asked for it after their first sign-in.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'last_name'), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Whether the signed-in user has a password yet (Google-only users don't).
-- Only exposes a boolean about the caller's own account.
create function public.has_password()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(encrypted_password is not null and encrypted_password <> '', false)
  from auth.users
  where id = (select auth.uid());
$$;

revoke execute on function public.has_password() from public, anon;
grant execute on function public.has_password() to authenticated;

-- Schema for the Mail app (applied to the Supabase project as migration "create_emails_table").
create table public.emails (
  id uuid primary key default gen_random_uuid(),
  folder text not null default 'sent' check (folder in ('inbox', 'sent')),
  sender_name text not null check (char_length(sender_name) between 1 and 80),
  sender_email text not null check (char_length(sender_email) between 3 and 254),
  recipient_email text not null check (char_length(recipient_email) between 3 and 254),
  subject text not null check (char_length(subject) between 1 and 200),
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

create index emails_folder_created_at_idx on public.emails (folder, created_at desc);

alter table public.emails enable row level security;

-- Everyone can read; the public can only insert into "sent". No updates or deletes.
create policy "Anyone can read emails"
  on public.emails for select to anon, authenticated using (true);

create policy "Anyone can send emails into the sent folder"
  on public.emails for insert to anon, authenticated with check (folder = 'sent');

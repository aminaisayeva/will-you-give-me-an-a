-- Terminal Academy: which lessons each signed-in learner has completed.
-- Applied as migration "course_progress". Guests keep progress in their
-- browser; it's copied here when they sign in.
create table public.course_progress (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  lesson_id text not null check (lesson_id ~ '^[a-z0-9-]{3,60}$'),
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

alter table public.course_progress enable row level security;

create policy "Learners read their own progress"
  on public.course_progress for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Learners record their own progress"
  on public.course_progress for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Learners reset their own progress"
  on public.course_progress for delete to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.course_progress from anon;
revoke insert, update, delete on public.course_progress from authenticated;
grant insert (lesson_id) on public.course_progress to authenticated;
grant delete on public.course_progress to authenticated;

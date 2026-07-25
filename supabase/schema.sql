-- Kanban Board — Supabase schema, RLS policies, and realtime setup
-- Run this whole file once in the Supabase SQL Editor (Project → SQL Editor → New query).
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS guards.

-- ─────────────────────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────────────────────
create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────

create table if not exists public.team_members (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  color       text not null default '#6e4bfa',
  avatar_url  text,
  created_at  timestamptz not null default now()
);

create table if not exists public.labels (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  color       text not null default '#6e4bfa',
  created_at  timestamptz not null default now()
);

create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  title        text not null,
  description  text,
  status       text not null default 'todo'
               check (status in ('todo', 'in_progress', 'in_review', 'done')),
  priority     text not null default 'normal'
               check (priority in ('low', 'normal', 'high')),
  due_date     date,
  position     double precision not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Many-to-many: a task can have multiple assignees, a member can have multiple tasks.
create table if not exists public.task_assignees (
  task_id    uuid not null references public.tasks (id) on delete cascade,
  member_id  uuid not null references public.team_members (id) on delete cascade,
  primary key (task_id, member_id)
);

-- Many-to-many: a task can have multiple labels.
create table if not exists public.task_labels (
  task_id   uuid not null references public.tasks (id) on delete cascade,
  label_id  uuid not null references public.labels (id) on delete cascade,
  primary key (task_id, label_id)
);

create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  author_name text not null default 'You',
  body        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.activity_log (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  type        text not null,
  detail      text not null,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────
create index if not exists idx_tasks_user_status on public.tasks (user_id, status);
create index if not exists idx_comments_task on public.comments (task_id);
create index if not exists idx_activity_task on public.activity_log (task_id);
create index if not exists idx_team_members_user on public.team_members (user_id);
create index if not exists idx_labels_user on public.labels (user_id);

-- ─────────────────────────────────────────────────────────────
-- updated_at trigger
-- ─────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Row Level Security — every row is scoped to its owning guest user
-- ─────────────────────────────────────────────────────────────
alter table public.team_members  enable row level security;
alter table public.labels        enable row level security;
alter table public.tasks         enable row level security;
alter table public.task_assignees enable row level security;
alter table public.task_labels   enable row level security;
alter table public.comments      enable row level security;
alter table public.activity_log  enable row level security;

-- team_members
drop policy if exists "team_members_owner_all" on public.team_members;
create policy "team_members_owner_all" on public.team_members
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- labels
drop policy if exists "labels_owner_all" on public.labels;
create policy "labels_owner_all" on public.labels
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- tasks
drop policy if exists "tasks_owner_all" on public.tasks;
create policy "tasks_owner_all" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- comments
drop policy if exists "comments_owner_all" on public.comments;
create policy "comments_owner_all" on public.comments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- activity_log
drop policy if exists "activity_owner_all" on public.activity_log;
create policy "activity_owner_all" on public.activity_log
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- task_assignees — ownership derived from the parent task
drop policy if exists "task_assignees_owner_all" on public.task_assignees;
create policy "task_assignees_owner_all" on public.task_assignees
  for all using (
    exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid())
  );

-- task_labels — ownership derived from the parent task
drop policy if exists "task_labels_owner_all" on public.task_labels;
create policy "task_labels_owner_all" on public.task_labels
  for all using (
    exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────
-- Realtime — broadcast row changes so the board updates live
-- (idempotent: only adds a table to the publication if it isn't already in it)
-- ─────────────────────────────────────────────────────────────
do $$
declare
  tbl text;
begin
  foreach tbl in array array['tasks', 'comments', 'activity_log', 'task_assignees', 'task_labels']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = tbl
    ) then
      execute format('alter publication supabase_realtime add table public.%I', tbl);
    end if;
  end loop;
end $$;

create extension if not exists pgcrypto;

create table if not exists public.planner_notebooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  color text default '#2f7cff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.planner_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notebook_id uuid references public.planner_notebooks(id) on delete set null,
  title text,
  body text not null default '',
  note_type text not null default 'Brain Dump',
  tags text[] not null default '{}',
  links text[] not null default '{}',
  handles text[] not null default '{}',
  phone_numbers text[] not null default '{}',
  emails text[] not null default '{}',
  pinned boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists planner_notebooks_user_idx on public.planner_notebooks(user_id);
create index if not exists planner_notes_user_idx on public.planner_notes(user_id);
create index if not exists planner_notes_notebook_idx on public.planner_notes(notebook_id);
create index if not exists planner_notes_pinned_idx on public.planner_notes(user_id, pinned desc, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists planner_notebooks_set_updated_at on public.planner_notebooks;
create trigger planner_notebooks_set_updated_at
before update on public.planner_notebooks
for each row execute function public.set_updated_at();

drop trigger if exists planner_notes_set_updated_at on public.planner_notes;
create trigger planner_notes_set_updated_at
before update on public.planner_notes
for each row execute function public.set_updated_at();

alter table public.planner_notebooks enable row level security;
alter table public.planner_notes enable row level security;

drop policy if exists "Users can view their planner notebooks" on public.planner_notebooks;
create policy "Users can view their planner notebooks"
on public.planner_notebooks for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their planner notebooks" on public.planner_notebooks;
create policy "Users can insert their planner notebooks"
on public.planner_notebooks for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their planner notebooks" on public.planner_notebooks;
create policy "Users can update their planner notebooks"
on public.planner_notebooks for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their planner notebooks" on public.planner_notebooks;
create policy "Users can delete their planner notebooks"
on public.planner_notebooks for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view their planner notes" on public.planner_notes;
create policy "Users can view their planner notes"
on public.planner_notes for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their planner notes" on public.planner_notes;
create policy "Users can insert their planner notes"
on public.planner_notes for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their planner notes" on public.planner_notes;
create policy "Users can update their planner notes"
on public.planner_notes for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their planner notes" on public.planner_notes;
create policy "Users can delete their planner notes"
on public.planner_notes for delete
to authenticated
using (auth.uid() = user_id);

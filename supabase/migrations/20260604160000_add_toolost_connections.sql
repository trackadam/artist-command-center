create extension if not exists pgcrypto;

create table if not exists public.toolost_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  token_type text default 'Bearer',
  expires_in integer,
  expires_at timestamptz,
  scope text,
  environment text not null default 'sandbox',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint toolost_connections_user_environment_unique unique (user_id, environment)
);

create index if not exists toolost_connections_user_idx on public.toolost_connections(user_id);
create index if not exists toolost_connections_environment_idx on public.toolost_connections(environment);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists toolost_connections_set_updated_at on public.toolost_connections;
create trigger toolost_connections_set_updated_at
before update on public.toolost_connections
for each row execute function public.set_updated_at();

alter table public.toolost_connections enable row level security;

drop policy if exists "Users can view their Too Lost connections" on public.toolost_connections;
create policy "Users can view their Too Lost connections"
on public.toolost_connections for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their Too Lost connections" on public.toolost_connections;
create policy "Users can insert their Too Lost connections"
on public.toolost_connections for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their Too Lost connections" on public.toolost_connections;
create policy "Users can update their Too Lost connections"
on public.toolost_connections for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their Too Lost connections" on public.toolost_connections;
create policy "Users can delete their Too Lost connections"
on public.toolost_connections for delete
to authenticated
using (auth.uid() = user_id);

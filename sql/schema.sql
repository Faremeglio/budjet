-- Supabase schema for Family Budget workspace sync
create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  family_code_hash text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_sessions (
  token text primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

create table if not exists public.expenses (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_at timestamptz not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  date date not null,
  amount numeric(12,2) not null,
  currency text not null,
  category_id uuid not null,
  note text
);

create table if not exists public.categories (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_at timestamptz not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  name text not null,
  color text not null
);

create table if not exists public.settings (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_at timestamptz not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  base_currency text not null,
  favorite_currencies text[] not null,
  display_currency text not null
);

create index if not exists idx_expenses_workspace_updated on public.expenses(workspace_id, updated_at);
create index if not exists idx_expenses_workspace_date on public.expenses(workspace_id, date);
create index if not exists idx_expenses_workspace_deleted on public.expenses(workspace_id, deleted_at);
create index if not exists idx_categories_workspace_updated on public.categories(workspace_id, updated_at);
create index if not exists idx_settings_workspace_updated on public.settings(workspace_id, updated_at);

alter table public.workspaces enable row level security;
alter table public.workspace_sessions enable row level security;
alter table public.expenses enable row level security;
alter table public.categories enable row level security;
alter table public.settings enable row level security;

create or replace function public.current_workspace_id()
returns uuid
language sql
stable
as $$
  select workspace_id from public.workspace_sessions where token = current_setting('request.jwt.claims', true)::jsonb ->> 'ws_token' limit 1
$$;

create policy "workspace read expenses" on public.expenses
for select using (workspace_id = public.current_workspace_id());
create policy "workspace write expenses" on public.expenses
for all using (workspace_id = public.current_workspace_id()) with check (workspace_id = public.current_workspace_id());

create policy "workspace read categories" on public.categories
for select using (workspace_id = public.current_workspace_id());
create policy "workspace write categories" on public.categories
for all using (workspace_id = public.current_workspace_id()) with check (workspace_id = public.current_workspace_id());

create policy "workspace read settings" on public.settings
for select using (workspace_id = public.current_workspace_id());
create policy "workspace write settings" on public.settings
for all using (workspace_id = public.current_workspace_id()) with check (workspace_id = public.current_workspace_id());

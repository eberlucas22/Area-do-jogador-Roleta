-- ─────────────────────────────────────────────────────────────
-- Schema: Área do Jogador
-- Executar no Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

-- Extensões necessárias
create extension if not exists "uuid-ossp";

-- ─── PROFILES ─────────────────────────────────────────────────
create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  affiliate_slug   text        not null,
  display_name     text,
  accepted_terms_at timestamptz,
  telegram_handle  text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: own read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: own insert"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles: own update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ─── BANKROLLS ────────────────────────────────────────────────
create table if not exists public.bankrolls (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  affiliate_slug text not null,
  initial_amount numeric(12,2) not null default 0,
  current_amount numeric(12,2) not null default 0,
  currency       text not null default 'BRL',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.bankrolls enable row level security;

create policy "bankrolls: own read"
  on public.bankrolls for select
  using (auth.uid() = user_id);

create policy "bankrolls: own insert"
  on public.bankrolls for insert
  with check (auth.uid() = user_id);

create policy "bankrolls: own update"
  on public.bankrolls for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── SESSIONS ─────────────────────────────────────────────────
create table if not exists public.sessions (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  affiliate_slug text not null,
  started_at     timestamptz not null default now(),
  ended_at       timestamptz,
  profit_loss    numeric(12,2),
  notes          text,
  created_at     timestamptz not null default now()
);

alter table public.sessions enable row level security;

create policy "sessions: own read"
  on public.sessions for select
  using (auth.uid() = user_id);

create policy "sessions: own insert"
  on public.sessions for insert
  with check (auth.uid() = user_id);

create policy "sessions: own update"
  on public.sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "sessions: own delete"
  on public.sessions for delete
  using (auth.uid() = user_id);

-- ─── LIMIT EVENTS ─────────────────────────────────────────────
create table if not exists public.limit_events (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  affiliate_slug text not null,
  event_type     text not null, -- 'daily_loss', 'session_stop', 'deposit_limit', 'self_exclusion'
  amount         numeric(12,2),
  period_days    int,
  triggered_at   timestamptz not null default now(),
  metadata       jsonb
);

alter table public.limit_events enable row level security;

create policy "limit_events: own read"
  on public.limit_events for select
  using (auth.uid() = user_id);

create policy "limit_events: own insert"
  on public.limit_events for insert
  with check (auth.uid() = user_id);

-- ─── UPDATED_AT trigger ───────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger bankrolls_updated_at
  before update on public.bankrolls
  for each row execute procedure public.set_updated_at();

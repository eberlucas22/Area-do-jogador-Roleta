create table if not exists public.gestao_cycles (
  id            uuid primary key default gen_random_uuid(),
  device_id     uuid not null,
  initial_amount numeric not null,
  days          jsonb not null,
  is_active     boolean default true,
  started_at    timestamptz default now(),
  closed_at     timestamptz
);
create index on public.gestao_cycles (device_id, is_active);
alter table public.gestao_cycles enable row level security;
create policy "open" on public.gestao_cycles for all using (true) with check (true);

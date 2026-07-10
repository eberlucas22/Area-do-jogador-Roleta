-- ═══════════════════════════════════════════════════════════════
-- Schema v2 — Rick Roleta App
-- Execute no SQL Editor do Supabase Dashboard
-- ═══════════════════════════════════════════════════════════════

-- 1. PROFILES — estende auth.users com role
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'user' check (role in ('admin', 'user')),
  created_at  timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own read"   on public.profiles for select using (auth.uid() = id);
create policy "own insert" on public.profiles for insert with check (auth.uid() = id);
create policy "own update" on public.profiles for update using (auth.uid() = id);

-- Auto-criar profile na criação de usuário
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. SETTINGS — percentuais stop win/loss (leitura pública, escrita admin)
create table if not exists public.settings (
  id              serial primary key,
  stop_win_pct    numeric not null default 10,
  stop_loss_pct   numeric not null default 40,
  updated_at      timestamptz not null default now()
);
alter table public.settings enable row level security;
create policy "public read"  on public.settings for select using (true);
create policy "admin write"  on public.settings for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
-- Seed com valores padrão
insert into public.settings (stop_win_pct, stop_loss_pct) values (10, 40)
on conflict do nothing;

-- 3. PLAYS — jogadas/estratégias gerenciadas pelo admin
create table if not exists public.plays (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text not null default '',
  risk_level   text not null default 'Médio' check (risk_level in ('Baixo', 'Médio', 'Alto')),
  numbers      int[] not null default '{}',
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);
alter table public.plays enable row level security;
create policy "public read"  on public.plays for select using (true);
create policy "admin write"  on public.plays for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
-- Seed com as 5 jogadas iniciais
insert into public.plays (name, description, risk_level, numbers, sort_order) values
  ('Coluna 3 + Vermelho', 'Aposta na 3ª coluna (múltiplos de 3) combinada com vermelho.', 'Baixo',  '{3,6,9,12,15,18,21,24,27,30,33,36}', 1),
  ('Dúzia 2 + Preto',     'Aposta nos números 13-24 (segunda dúzia) com foco em pretos.', 'Médio',  '{13,14,15,16,17,18,19,20,21,22,23,24}', 2),
  ('Vizinhos do Zero',    'Cobre os números ao redor do zero na roda europeia.', 'Médio', '{0,26,32,15,19,4,21,2,25}', 3),
  ('19-36 + Par',         'Alta + Pares: metade superior do tabuleiro com números pares.', 'Baixo', '{19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36}', 4),
  ('Martingale Vermelho', 'Aposta progressiva em vermelho: dobra após cada derrota.', 'Alto', '{1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36}', 5)
on conflict do nothing;

-- 4. MATERIALS — PDFs gerenciados pelo admin
create table if not exists public.materials (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text not null default '',
  file_path    text not null,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);
alter table public.materials enable row level security;
create policy "public read"  on public.materials for select using (true);
create policy "admin write"  on public.materials for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- 5. BANKROLLS — banca do usuário (substituição do localStorage)
create table if not exists public.bankrolls (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  current_amount  numeric not null default 0,
  initial_amount  numeric not null default 0,
  started_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table public.bankrolls enable row level security;
create policy "own access" on public.bankrolls for all using (auth.uid() = user_id);

-- 6. DAILY_CHECKINS — registro diário de resultado
create table if not exists public.daily_checkins (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  bankroll_id   uuid references public.bankrolls(id) on delete set null,
  checkin_date  date not null,
  result        text not null check (result in ('stop_win', 'stop_loss', 'manual')),
  end_amount    numeric not null,
  created_at    timestamptz not null default now(),
  unique (user_id, checkin_date)
);
alter table public.daily_checkins enable row level security;
create policy "own access" on public.daily_checkins for all using (auth.uid() = user_id);

-- 7. Storage bucket para materiais (PDFs)
-- Execute se o bucket ainda não existir:
-- insert into storage.buckets (id, name, public) values ('materials', 'materials', false);
-- create policy "public download" on storage.objects for select using (bucket_id = 'materials');
-- create policy "admin upload" on storage.objects for insert using (
--   bucket_id = 'materials' and
--   exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
-- );
-- create policy "admin delete" on storage.objects for delete using (
--   bucket_id = 'materials' and
--   exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
-- );

-- ═══════════════════════════════════════════════════════════════
-- Para criar o primeiro admin, execute após cadastro do usuário:
-- update public.profiles set role = 'admin' where id = '<uuid-do-usuario>';
-- ═══════════════════════════════════════════════════════════════

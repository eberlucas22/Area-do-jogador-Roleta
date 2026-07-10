-- Phase 4: Banners, Plataformas, Vídeos e Suporte
-- Execute no SQL Editor do Supabase

-- ========== STORAGE BUCKETS ==========
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('banners',   'banners',   true, 5242880,  ARRAY['image/jpeg','image/png','image/webp']),
  ('platforms', 'platforms', true, 1048576,  ARRAY['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('support',   'support',   true, 2097152,  ARRAY['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- ========== BANNERS ==========
create table if not exists public.banners (
  id                uuid primary key default gen_random_uuid(),
  image_path        text not null,
  image_path_mobile text,
  link_url          text,
  sort_order        int not null default 0,
  is_active         boolean not null default true,
  created_at        timestamptz default now()
);
alter table public.banners enable row level security;
create policy "public read banners"
  on public.banners for select using (true);
create policy "admin write banners"
  on public.banners for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ========== PLATFORMS ==========
create table if not exists public.platforms (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  logo_path    text,
  description  text,
  benefits     text[] not null default '{}',
  cta_url      text,
  accent_color text,
  sort_order   int not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz default now()
);
alter table public.platforms enable row level security;
create policy "public read platforms"
  on public.platforms for select using (true);
create policy "admin write platforms"
  on public.platforms for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Seed plataformas
insert into public.platforms (name, description, benefits, cta_url, sort_order) values
  ('MaximaBet',  'Plataforma premium com os melhores mercados de apostas.',
   ARRAY['Bônus de boas-vindas','Saques rápidos','Roleta ao vivo 24h'],
   'https://maximabet.com', 1),
  ('UltraBet',   'A experiência mais completa em jogos online.',
   ARRAY['Odds competitivas','App mobile otimizado','Suporte 24/7'],
   'https://ultrabet.com', 2),
  ('SupremaBet', 'Apostas esportivas e casino em um só lugar.',
   ARRAY['Cashback semanal','Torneios exclusivos','Pagamento via Pix'],
   'https://supremabet.com', 3);

-- ========== VIDEOS ==========
create table if not exists public.videos (
  id          uuid primary key default gen_random_uuid(),
  youtube_url text not null,
  video_id    text not null,
  title       text,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz default now()
);
alter table public.videos enable row level security;
create policy "public read videos"
  on public.videos for select using (true);
create policy "admin write videos"
  on public.videos for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ========== SUPPORT CHANNELS ==========
create table if not exists public.support_channels (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  channel_type text not null check (channel_type in ('whatsapp','telegram','instagram','youtube','outro')),
  url          text not null,
  image_path   text,
  sort_order   int not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz default now()
);
alter table public.support_channels enable row level security;
create policy "public read support_channels"
  on public.support_channels for select using (true);
create policy "admin write support_channels"
  on public.support_channels for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

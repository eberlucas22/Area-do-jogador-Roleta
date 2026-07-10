-- Phase 5: Design System schema additions
-- Run in Supabase SQL Editor

-- 1. Add description column to support_channels
ALTER TABLE public.support_channels
  ADD COLUMN IF NOT EXISTS description text;

-- 2. Table for real roulette spins (Histórico module)
CREATE TABLE IF NOT EXISTS public.roulette_spins (
  id         uuid primary key default gen_random_uuid(),
  affiliate  text not null,          -- slug do afiliado (ex: 'rick-roleta')
  number     int  not null check (number between 0 and 36),
  spun_at    timestamptz default now()
);

CREATE INDEX IF NOT EXISTS roulette_spins_affiliate_idx
  ON public.roulette_spins (affiliate, spun_at DESC);

ALTER TABLE public.roulette_spins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read spins"
  ON public.roulette_spins
  FOR SELECT
  USING (true);

CREATE POLICY "auth insert spins"
  ON public.roulette_spins
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

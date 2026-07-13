-- Migration: adicionar user_id à gestao_cycles e ajustar RLS
-- Execute no Supabase Dashboard → SQL Editor

-- Garantir coluna user_id
ALTER TABLE public.gestao_cycles
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Índice para queries por user_id
CREATE INDEX IF NOT EXISTS gestao_cycles_user_id_idx
  ON public.gestao_cycles (user_id, is_active);

-- Substituir política "open" por políticas baseadas em user_id
DROP POLICY IF EXISTS "open" ON public.gestao_cycles;

-- Auth users acessam seus próprios ciclos
CREATE POLICY "cycles_own" ON public.gestao_cycles
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ciclos sem user_id ainda acessíveis (migração gradual de orphans)
CREATE POLICY "cycles_orphan" ON public.gestao_cycles
  FOR ALL USING (user_id IS NULL);

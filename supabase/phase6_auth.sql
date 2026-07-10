-- Phase 6: Auth de Usuários
-- Extender profiles e gestao_cycles para suporte a user_id

-- Extender profiles com campos de cadastro e LGPD
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS marketing_opt_in boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepted_terms_at timestamptz;

-- Adicionar user_id em gestao_cycles (migração device_id → user_id)
ALTER TABLE public.gestao_cycles
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS gestao_cycles_user_id_idx ON public.gestao_cycles (user_id);

-- RLS: manter device_id legado + user_id
-- Ciclos sem user_id (legado) são acessíveis por qualquer um (device_id no client)
-- Ciclos com user_id só acessíveis pelo dono
DROP POLICY IF EXISTS "open" ON public.gestao_cycles;
CREATE POLICY "gestao owner" ON public.gestao_cycles
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

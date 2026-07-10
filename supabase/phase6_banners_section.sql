-- Phase 6: Banners por seção
-- Adiciona coluna section à tabela banners
-- Banners existentes → 'global' automaticamente pelo DEFAULT

ALTER TABLE public.banners
  ADD COLUMN IF NOT EXISTS section text NOT NULL DEFAULT 'global'
  CHECK (section IN ('banca','jogadas','historico','videos','suporte','regras','global'));

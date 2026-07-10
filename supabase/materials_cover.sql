-- Adiciona coluna de capa aos materiais
-- Execute no SQL Editor do Supabase
alter table public.materials add column if not exists cover_path text;

-- Phase 7: historico_games table
CREATE TABLE IF NOT EXISTS public.historico_games (
  id                bigserial PRIMARY KEY,
  name              text NOT NULL,
  provider          text NOT NULL DEFAULT '',
  category          text NOT NULL DEFAULT 'Live Casino',
  realtime_channel  text NOT NULL,
  image_path        text,
  sort_order        int  NOT NULL DEFAULT 0,
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.historico_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "games_select" ON public.historico_games
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "games_admin" ON public.historico_games
  FOR ALL TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Seed: jogo existente
INSERT INTO public.historico_games (name, provider, category, realtime_channel, sort_order)
VALUES ('Roleta Brasileira', 'Playtech', 'Live Casino', 'roleta_brasileira_playtech_results', 0)
ON CONFLICT DO NOTHING;

-- Storage bucket 'games': criar via Dashboard (público, 2MB, jpg/png/webp)
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES ('games', 'games', true, 2097152, ARRAY['image/jpeg','image/png','image/webp'])
-- ON CONFLICT (id) DO NOTHING;

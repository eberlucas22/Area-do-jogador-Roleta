-- Tabela para armazenar histórico de resultados da roleta
CREATE TABLE IF NOT EXISTS public.roulette_results (
  id          bigserial PRIMARY KEY,
  channel     text        NOT NULL DEFAULT 'roleta_brasileira_playtech_results',
  number      smallint    NOT NULL CHECK (number >= 0 AND number <= 36),
  multipliers jsonb,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS roulette_results_channel_time_idx
  ON public.roulette_results (channel, received_at DESC);

ALTER TABLE public.roulette_results ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem ler
CREATE POLICY "roulette_results_select" ON public.roulette_results
  FOR SELECT TO authenticated USING (true);

-- Usuários autenticados podem inserir (cliente salva ao receber)
CREATE POLICY "roulette_results_insert" ON public.roulette_results
  FOR INSERT TO authenticated WITH CHECK (true);

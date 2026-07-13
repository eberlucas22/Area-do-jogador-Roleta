CREATE OR REPLACE FUNCTION public.save_roulette_result(
  p_channel     text,
  p_number      smallint,
  p_multipliers jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  INSERT INTO public.roulette_results (channel, number, multipliers)
  VALUES (p_channel, p_number, p_multipliers);

  DELETE FROM public.roulette_results
  WHERE channel = p_channel
    AND id NOT IN (
      SELECT id FROM public.roulette_results
      WHERE channel = p_channel
      ORDER BY received_at DESC
      LIMIT 500
    );
END;
$func$;

GRANT EXECUTE ON FUNCTION public.save_roulette_result TO authenticated, service_role;


CREATE OR REPLACE FUNCTION public.get_level_ranking(_limit integer DEFAULT 200)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  level integer,
  stage integer,
  max_stage integer,
  prestige_level integer,
  extra jsonb,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ps.user_id,
    COALESCE(
      (SELECT lb.display_name FROM public.leaderboards lb
        WHERE lb.user_id = ps.user_id AND lb.display_name IS NOT NULL
        ORDER BY lb.updated_at DESC LIMIT 1),
      'Herói'
    ) AS display_name,
    COALESCE(ps.level, 1) AS level,
    COALESCE(ps.stage, 1) AS stage,
    COALESCE(ps.max_stage, ps.stage, 1) AS max_stage,
    COALESCE(ps.prestige_level, 0) AS prestige_level,
    COALESCE(
      (SELECT lb.extra FROM public.leaderboards lb
        WHERE lb.user_id = ps.user_id AND lb.extra IS NOT NULL
        ORDER BY lb.updated_at DESC LIMIT 1),
      '{}'::jsonb
    ) AS extra,
    ps.updated_at
  FROM public.player_saves ps
  ORDER BY
    COALESCE(ps.prestige_level, 0) DESC,
    COALESCE(ps.level, 1) DESC,
    COALESCE(ps.max_stage, ps.stage, 1) DESC,
    ps.updated_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 500));
$$;

GRANT EXECUTE ON FUNCTION public.get_level_ranking(integer) TO anon, authenticated;

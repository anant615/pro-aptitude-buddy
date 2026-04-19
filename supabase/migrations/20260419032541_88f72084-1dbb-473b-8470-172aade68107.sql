
DROP POLICY IF EXISTS "Anyone reads aggregate attempts" ON public.dpp_attempts;

CREATE OR REPLACE FUNCTION public.dpp_stats(_date date, _title text)
RETURNS TABLE(attempts bigint, avg_score numeric, avg_pct numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::bigint AS attempts,
         COALESCE(ROUND(AVG(score)::numeric, 2), 0) AS avg_score,
         COALESCE(ROUND(AVG(CASE WHEN total > 0 THEN score::numeric / total * 100 ELSE 0 END), 2), 0) AS avg_pct
  FROM public.dpp_attempts
  WHERE dpp_date = _date AND dpp_title = _title;
$$;

CREATE OR REPLACE FUNCTION public.dpp_user_rank(_date date, _title text, _user_id uuid)
RETURNS TABLE(rank bigint, total_attempts bigint, user_score integer, user_pct numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT user_id, score, total,
           CASE WHEN total > 0 THEN score::numeric / total ELSE 0 END AS pct
    FROM public.dpp_attempts
    WHERE dpp_date = _date AND dpp_title = _title
  ),
  me AS (SELECT * FROM base WHERE user_id = _user_id LIMIT 1)
  SELECT
    (SELECT COUNT(*) + 1 FROM base WHERE pct > (SELECT pct FROM me))::bigint AS rank,
    (SELECT COUNT(*) FROM base)::bigint AS total_attempts,
    (SELECT score FROM me) AS user_score,
    (SELECT ROUND(pct * 100, 2) FROM me) AS user_pct;
$$;

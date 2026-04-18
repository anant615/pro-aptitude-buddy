-- 1. Tighten profiles: only owner or admin can read (was: only owner — keep, but block public)
-- already restrictive, no change needed

-- 2. user_points was public — expose only safe leaderboard fields via view, lock base table
DROP POLICY IF EXISTS "Points totals public" ON public.user_points;
CREATE POLICY "Users see own points"
  ON public.user_points FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins see all points"
  ON public.user_points FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Public leaderboard view (no emails, no last_active_date)
CREATE OR REPLACE VIEW public.leaderboard
WITH (security_invoker=on) AS
SELECT
  user_id,
  COALESCE(display_name, 'Anonymous') AS display_name,
  total_points,
  current_streak,
  longest_streak
FROM public.user_points
ORDER BY total_points DESC
LIMIT 100;

-- 3. community_votes was public — restrict to owner + admin (vote counts already on questions/answers)
DROP POLICY IF EXISTS "Votes readable by all" ON public.community_votes;
CREATE POLICY "Users see own votes"
  ON public.community_votes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 4. Performance indexes for scale
CREATE INDEX IF NOT EXISTS idx_page_views_created ON public.page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_path_created ON public.page_views(path, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_user ON public.page_views(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_link_clicks_created ON public.link_clicks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_link_clicks_type_created ON public.link_clicks(link_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_link_clicks_source ON public.link_clicks(source_path);

CREATE INDEX IF NOT EXISTS idx_feedback_created ON public.feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_resolved ON public.feedback(resolved) WHERE resolved = false;

CREATE INDEX IF NOT EXISTS idx_community_questions_created ON public.community_questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_questions_category ON public.community_questions(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_questions_user ON public.community_questions(user_id);

CREATE INDEX IF NOT EXISTS idx_community_answers_question ON public.community_answers(question_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_answers_user ON public.community_answers(user_id);

CREATE INDEX IF NOT EXISTS idx_community_votes_user_target ON public.community_votes(user_id, target_id);
CREATE INDEX IF NOT EXISTS idx_community_votes_target ON public.community_votes(target_id);

CREATE INDEX IF NOT EXISTS idx_user_points_total ON public.user_points(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_created ON public.user_activity(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_events_user_created ON public.point_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles(user_id, role);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON public.profiles(user_id);
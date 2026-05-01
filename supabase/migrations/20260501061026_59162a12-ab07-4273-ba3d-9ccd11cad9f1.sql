CREATE TABLE public.war_room_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  mock_link TEXT,
  mock_name TEXT,
  notes TEXT,
  report TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.war_room_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own reports" ON public.war_room_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users insert own reports" ON public.war_room_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users delete own reports" ON public.war_room_reports
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "admins read all reports" ON public.war_room_reports
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_war_room_reports_user ON public.war_room_reports(user_id, created_at DESC);
-- Page views
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  user_id uuid,
  referrer text,
  user_agent text,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_page_views_path ON public.page_views(path);
CREATE INDEX idx_page_views_created ON public.page_views(created_at DESC);
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone insert page view" ON public.page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "admins read page views" ON public.page_views FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Link clicks (YouTube + others)
CREATE TABLE public.link_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  source_path text,
  link_type text NOT NULL DEFAULT 'external',
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_link_clicks_type ON public.link_clicks(link_type);
CREATE INDEX idx_link_clicks_created ON public.link_clicks(created_at DESC);
ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone insert link click" ON public.link_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "admins read link clicks" ON public.link_clicks FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Feedback
CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  rating integer,
  category text NOT NULL DEFAULT 'general',
  message text NOT NULL,
  page_path text,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_feedback_created ON public.feedback(created_at DESC);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone insert feedback" ON public.feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "admins read feedback" ON public.feedback FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update feedback" ON public.feedback FOR UPDATE USING (has_role(auth.uid(), 'admin'));
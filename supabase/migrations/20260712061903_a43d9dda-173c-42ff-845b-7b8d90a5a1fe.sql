
CREATE TABLE public.mock_hub_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam TEXT NOT NULL,
  institute TEXT NOT NULL,
  mock_name TEXT NOT NULL,
  institute_logo_url TEXT,
  official_link TEXT NOT NULL,
  price_inr NUMERIC DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  free_mocks_count INTEGER DEFAULT 0,
  total_mocks_count INTEGER DEFAULT 0,
  difficulty TEXT DEFAULT 'moderate',
  exam_similarity_pct INTEGER DEFAULT 70,
  overall_rating NUMERIC DEFAULT 8.0,
  question_quality NUMERIC DEFAULT 8.0,
  sectional_analysis NUMERIC DEFAULT 8.0,
  dashboard_experience NUMERIC DEFAULT 8.0,
  price_value NUMERIC DEFAULT 8.0,
  best_for TEXT,
  analysis_quality TEXT,
  pros TEXT[] DEFAULT '{}',
  cons TEXT[] DEFAULT '{}',
  category_tags TEXT[] DEFAULT '{}',
  featured_rank INTEGER,
  is_sponsored BOOLEAN DEFAULT false,
  screenshots TEXT[] DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mock_hub_entries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mock_hub_entries TO authenticated;
GRANT ALL ON public.mock_hub_entries TO service_role;
ALTER TABLE public.mock_hub_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view mock hub entries" ON public.mock_hub_entries FOR SELECT USING (true);
CREATE POLICY "Admins can insert mock hub entries" ON public.mock_hub_entries FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update mock hub entries" ON public.mock_hub_entries FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete mock hub entries" ON public.mock_hub_entries FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER mock_hub_entries_updated_at BEFORE UPDATE ON public.mock_hub_entries FOR EACH ROW EXECUTE FUNCTION public.tr_set_updated_at();

CREATE TABLE public.mock_hub_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mock_id UUID NOT NULL REFERENCES public.mock_hub_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  stars INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  similarity_rating INTEGER CHECK (similarity_rating BETWEEN 1 AND 5),
  difficulty TEXT,
  would_recommend BOOLEAN DEFAULT true,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mock_hub_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mock_hub_reviews TO authenticated;
GRANT ALL ON public.mock_hub_reviews TO service_role;
ALTER TABLE public.mock_hub_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read reviews" ON public.mock_hub_reviews FOR SELECT USING (true);
CREATE POLICY "Auth users can insert own review" ON public.mock_hub_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own review" ON public.mock_hub_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users/admins can delete review" ON public.mock_hub_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_mock_hub_reviews_mock ON public.mock_hub_reviews(mock_id);
CREATE INDEX idx_mock_hub_entries_exam ON public.mock_hub_entries(exam);

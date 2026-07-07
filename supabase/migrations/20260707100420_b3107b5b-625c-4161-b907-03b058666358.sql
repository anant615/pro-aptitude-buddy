
CREATE TABLE public.study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  target_exam TEXT NOT NULL,
  target_year TEXT NOT NULL,
  target_percentile TEXT NOT NULL,
  level TEXT NOT NULL,
  student_type TEXT NOT NULL,
  hours_per_day TEXT NOT NULL,
  latest_mock_score INTEGER,
  qa_score INTEGER,
  lrdi_score INTEGER,
  varc_score INTEGER,
  mocks_taken INTEGER,
  strengths TEXT[] DEFAULT '{}',
  weak_areas TEXT[] DEFAULT '{}',
  syllabus_qa TEXT,
  syllabus_lrdi TEXT,
  syllabus_varc TEXT,
  plan JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_plans TO authenticated;
GRANT ALL ON public.study_plans TO service_role;
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own study plans" ON public.study_plans
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_study_plans_user ON public.study_plans(user_id, created_at DESC);
CREATE TRIGGER trg_study_plans_updated_at BEFORE UPDATE ON public.study_plans
  FOR EACH ROW EXECUTE FUNCTION public.tr_set_updated_at();

CREATE TABLE public.study_plan_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.study_plans(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('yes','partial','no')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, checkin_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_plan_checkins TO authenticated;
GRANT ALL ON public.study_plan_checkins TO service_role;
ALTER TABLE public.study_plan_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own checkins" ON public.study_plan_checkins
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_checkins_user_date ON public.study_plan_checkins(user_id, checkin_date DESC);

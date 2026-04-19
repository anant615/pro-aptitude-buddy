
-- Add duration column to dpps (minutes per DPP day)
ALTER TABLE public.dpps ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 20;

-- Table to record DPP attempts (one row per user per DPP day+title)
CREATE TABLE IF NOT EXISTS public.dpp_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  dpp_date date NOT NULL,
  dpp_title text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  seconds_taken integer NOT NULL DEFAULT 0,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, dpp_date, dpp_title)
);

ALTER TABLE public.dpp_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own attempts" ON public.dpp_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users see own attempts" ON public.dpp_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone reads aggregate attempts" ON public.dpp_attempts
  FOR SELECT USING (true);

CREATE POLICY "Admins see all attempts" ON public.dpp_attempts
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_dpp_attempts_dpp ON public.dpp_attempts (dpp_date, dpp_title);
CREATE INDEX IF NOT EXISTS idx_dpp_attempts_user ON public.dpp_attempts (user_id);

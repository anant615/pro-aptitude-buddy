CREATE TABLE public.solved_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question text NOT NULL,
  image_url text,
  solution text NOT NULL,
  exam_type text NOT NULL DEFAULT 'CAT',
  topic text,
  difficulty text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.solved_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own solved" ON public.solved_questions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own solved" ON public.solved_questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own solved" ON public.solved_questions
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins read all solved" ON public.solved_questions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_solved_questions_user_created ON public.solved_questions(user_id, created_at DESC);
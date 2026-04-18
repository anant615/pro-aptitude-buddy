
ALTER TABLE public.dpps
  ADD COLUMN IF NOT EXISTS q_type text NOT NULL DEFAULT 'mcq',
  ADD COLUMN IF NOT EXISTS q_number integer,
  ADD COLUMN IF NOT EXISTS options jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS correct_answer integer,
  ADD COLUMN IF NOT EXISTS solution text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS passage text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS set_id text,
  ADD COLUMN IF NOT EXISTS timer_seconds integer;

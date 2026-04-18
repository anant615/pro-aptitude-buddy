CREATE TABLE public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('video_watched','dpp_completed','pyq_attempted','resource_opened')),
  item_id TEXT NOT NULL,
  seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, activity_type, item_id)
);
CREATE INDEX idx_ua_user_type ON public.user_activity(user_id, activity_type);

ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own activity" ON public.user_activity FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own activity" ON public.user_activity FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own activity" ON public.user_activity FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.tr_activity_points() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _pts INTEGER;
BEGIN
  _pts := CASE NEW.activity_type
    WHEN 'video_watched' THEN 3
    WHEN 'dpp_completed' THEN 5
    WHEN 'pyq_attempted' THEN 4
    WHEN 'resource_opened' THEN 2
    ELSE 1 END;
  PERFORM award_points(NEW.user_id, NEW.activity_type, _pts, NULL);
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_activity_points AFTER INSERT ON public.user_activity FOR EACH ROW EXECUTE FUNCTION tr_activity_points();
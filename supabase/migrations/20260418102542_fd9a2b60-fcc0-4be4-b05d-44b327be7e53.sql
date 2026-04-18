-- ============ COMMUNITY ============
CREATE TABLE public.community_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 5 AND 200),
  body TEXT NOT NULL DEFAULT '' CHECK (char_length(body) <= 5000),
  category TEXT NOT NULL CHECK (category IN ('cat_prep','mba_colleges','gdpi_interviews','profile_review','scholarships_loans','general')),
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  vote_count INTEGER NOT NULL DEFAULT 0,
  answer_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cq_category ON public.community_questions(category);
CREATE INDEX idx_cq_created ON public.community_questions(created_at DESC);
CREATE INDEX idx_cq_votes ON public.community_questions(vote_count DESC);

CREATE TABLE public.community_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.community_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  vote_count INTEGER NOT NULL DEFAULT 0,
  is_accepted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ca_question ON public.community_answers(question_id);

CREATE TABLE public.community_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('question','answer')),
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id)
);
CREATE INDEX idx_cv_target ON public.community_votes(target_type, target_id);

ALTER TABLE public.community_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Questions readable by all" ON public.community_questions FOR SELECT USING (true);
CREATE POLICY "Users insert own questions" ON public.community_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own questions" ON public.community_questions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own questions" ON public.community_questions FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));

CREATE POLICY "Answers readable by all" ON public.community_answers FOR SELECT USING (true);
CREATE POLICY "Users insert own answers" ON public.community_answers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own answers" ON public.community_answers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own answers" ON public.community_answers FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));

CREATE POLICY "Votes readable by all" ON public.community_votes FOR SELECT USING (true);
CREATE POLICY "Users insert own votes" ON public.community_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own votes" ON public.community_votes FOR DELETE USING (auth.uid() = user_id);

-- ============ POINTS / LEADERBOARD ============
CREATE TABLE public.user_points (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  total_points INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_up_total ON public.user_points(total_points DESC);

CREATE TABLE public.point_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  points INTEGER NOT NULL,
  ref_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pe_user ON public.point_events(user_id, created_at DESC);

ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Points totals public" ON public.user_points FOR SELECT USING (true);
CREATE POLICY "Users see own events" ON public.point_events FOR SELECT USING (auth.uid() = user_id);

-- ============ HELPER: award points ============
CREATE OR REPLACE FUNCTION public.award_points(_user_id UUID, _event_type TEXT, _points INTEGER, _ref_id UUID DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _today DATE := CURRENT_DATE;
  _last DATE;
  _streak INTEGER;
  _longest INTEGER;
  _name TEXT;
BEGIN
  INSERT INTO point_events (user_id, event_type, points, ref_id) VALUES (_user_id, _event_type, _points, _ref_id);

  SELECT email INTO _name FROM profiles WHERE user_id = _user_id LIMIT 1;

  SELECT last_active_date, current_streak, longest_streak INTO _last, _streak, _longest FROM user_points WHERE user_id = _user_id;

  IF _last IS NULL THEN
    _streak := 1;
  ELSIF _last = _today THEN
    _streak := COALESCE(_streak, 1);
  ELSIF _last = _today - INTERVAL '1 day' THEN
    _streak := COALESCE(_streak, 0) + 1;
  ELSE
    _streak := 1;
  END IF;
  _longest := GREATEST(COALESCE(_longest, 0), _streak);

  INSERT INTO user_points (user_id, display_name, total_points, current_streak, longest_streak, last_active_date, updated_at)
  VALUES (_user_id, _name, _points, _streak, _longest, _today, now())
  ON CONFLICT (user_id) DO UPDATE
  SET total_points = user_points.total_points + EXCLUDED.total_points,
      current_streak = EXCLUDED.current_streak,
      longest_streak = EXCLUDED.longest_streak,
      last_active_date = EXCLUDED.last_active_date,
      display_name = COALESCE(user_points.display_name, EXCLUDED.display_name),
      updated_at = now();
END; $$;

-- ============ TRIGGERS: counts + points ============
CREATE OR REPLACE FUNCTION public.tr_question_insert() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM award_points(NEW.user_id, 'question_post', 5, NEW.id); RETURN NEW; END; $$;
CREATE TRIGGER trg_question_insert AFTER INSERT ON public.community_questions FOR EACH ROW EXECUTE FUNCTION tr_question_insert();

CREATE OR REPLACE FUNCTION public.tr_answer_insert() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE community_questions SET answer_count = answer_count + 1 WHERE id = NEW.question_id;
  PERFORM award_points(NEW.user_id, 'answer_post', 10, NEW.id);
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_answer_insert AFTER INSERT ON public.community_answers FOR EACH ROW EXECUTE FUNCTION tr_answer_insert();

CREATE OR REPLACE FUNCTION public.tr_answer_delete() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN UPDATE community_questions SET answer_count = GREATEST(answer_count - 1, 0) WHERE id = OLD.question_id; RETURN OLD; END; $$;
CREATE TRIGGER trg_answer_delete AFTER DELETE ON public.community_answers FOR EACH ROW EXECUTE FUNCTION tr_answer_delete();

CREATE OR REPLACE FUNCTION public.tr_vote_insert() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _author UUID;
BEGIN
  IF NEW.target_type = 'question' THEN
    UPDATE community_questions SET vote_count = vote_count + 1 WHERE id = NEW.target_id RETURNING user_id INTO _author;
  ELSE
    UPDATE community_answers SET vote_count = vote_count + 1 WHERE id = NEW.target_id RETURNING user_id INTO _author;
  END IF;
  IF _author IS NOT NULL AND _author <> NEW.user_id THEN
    PERFORM award_points(_author, 'upvote_received', 2, NEW.target_id);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_vote_insert AFTER INSERT ON public.community_votes FOR EACH ROW EXECUTE FUNCTION tr_vote_insert();

CREATE OR REPLACE FUNCTION public.tr_vote_delete() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.target_type = 'question' THEN
    UPDATE community_questions SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = OLD.target_id;
  ELSE
    UPDATE community_answers SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = OLD.target_id;
  END IF;
  RETURN OLD;
END; $$;
CREATE TRIGGER trg_vote_delete AFTER DELETE ON public.community_votes FOR EACH ROW EXECUTE FUNCTION tr_vote_delete();
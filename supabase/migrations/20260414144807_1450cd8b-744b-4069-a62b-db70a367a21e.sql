
CREATE TABLE public.mocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  exams TEXT[] NOT NULL DEFAULT '{}',
  link TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  free BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mocks are publicly readable" ON public.mocks FOR SELECT USING (true);
CREATE POLICY "Anyone can add mocks" ON public.mocks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete mocks" ON public.mocks FOR DELETE USING (true);

-- Seed existing data
INSERT INTO public.mocks (name, exams, link, description, free) VALUES
('Unacademy', ARRAY['CAT','XAT','IIFT'], 'https://unacademy.com/goal/cat-and-other-mba-entrance-tests', 'Free & paid sectional and full-length mocks', true),
('IMS Learning', ARRAY['CAT','CMAT','NMAT'], 'https://www.imsindia.com/cat-preparation/', 'SimCAT series with detailed analytics', false),
('Career Launcher', ARRAY['CAT','XAT','SNAP'], 'https://www.intriguecl.com/', 'National level mock tests with percentile tracking', false),
('2IIM', ARRAY['CAT'], 'https://iim-cat-questions-answers.2iim.com/', 'Free CAT questions and concept tests', true),
('Cracku', ARRAY['CAT','XAT','IIFT','SNAP'], 'https://cracku.in/cat', 'Daily tests, sectional mocks and full mocks', true),
('TestBook', ARRAY['CAT','OMET'], 'https://testbook.com/cat', 'Practice tests with detailed solutions', true);

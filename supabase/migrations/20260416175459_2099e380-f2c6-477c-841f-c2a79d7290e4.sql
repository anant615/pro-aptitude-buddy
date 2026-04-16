
CREATE TABLE public.resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  link TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'pdf',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Resources are publicly readable" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Anyone can add resources" ON public.resources FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete resources" ON public.resources FOR DELETE USING (true);

CREATE TABLE public.news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  link TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'Custom',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "News are publicly readable" ON public.news FOR SELECT USING (true);
CREATE POLICY "Anyone can add news" ON public.news FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete news" ON public.news FOR DELETE USING (true);

CREATE TABLE public.dpps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  question TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dpps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "DPPs are publicly readable" ON public.dpps FOR SELECT USING (true);
CREATE POLICY "Anyone can add dpps" ON public.dpps FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete dpps" ON public.dpps FOR DELETE USING (true);

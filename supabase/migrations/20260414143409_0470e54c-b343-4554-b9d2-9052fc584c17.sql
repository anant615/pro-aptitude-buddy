CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  title TEXT NOT NULL,
  creator TEXT NOT NULL DEFAULT 'Unknown',
  link TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Videos are publicly readable"
  ON public.videos FOR SELECT
  USING (true);

CREATE POLICY "Anyone can add videos"
  ON public.videos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can delete videos"
  ON public.videos FOR DELETE
  USING (true);
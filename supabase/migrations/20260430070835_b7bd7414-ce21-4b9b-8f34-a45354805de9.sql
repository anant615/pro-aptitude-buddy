
-- Threaded replies on feedback so users and admins can chat back and forth
CREATE TABLE public.feedback_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback_id UUID NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  user_id UUID,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedback_replies_feedback ON public.feedback_replies(feedback_id, created_at);

ALTER TABLE public.feedback_replies ENABLE ROW LEVEL SECURITY;

-- Admins can see and manage all replies
CREATE POLICY "admins read all replies" ON public.feedback_replies
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins insert replies" ON public.feedback_replies
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND is_admin = true);

CREATE POLICY "admins update replies" ON public.feedback_replies
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins delete replies" ON public.feedback_replies
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can read replies on their own feedback threads
CREATE POLICY "users read own thread replies" ON public.feedback_replies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.feedback f
      WHERE f.id = feedback_replies.feedback_id
        AND f.user_id IS NOT NULL
        AND f.user_id = auth.uid()
    )
  );

-- Users can post replies on their own feedback threads (non-admin replies)
CREATE POLICY "users insert own thread replies" ON public.feedback_replies
  FOR INSERT WITH CHECK (
    is_admin = false
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.feedback f
      WHERE f.id = feedback_replies.feedback_id
        AND f.user_id = auth.uid()
    )
  );

-- Allow logged-in users to read their own feedback rows (so they can list their threads)
CREATE POLICY "users read own feedback" ON public.feedback
  FOR SELECT USING (user_id IS NOT NULL AND user_id = auth.uid());

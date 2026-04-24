
-- Reminder subscribers: lets guest users (and registered users) opt in to
-- receive a daily/new-content email when the next DPP, news brief or mock drops.
CREATE TABLE IF NOT EXISTS public.reminder_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  user_id uuid,
  source text NOT NULL DEFAULT 'dpp', -- which page they subscribed from
  topics text[] NOT NULL DEFAULT ARRAY['dpp','news','mock']::text[],
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS reminder_subscribers_email_key
  ON public.reminder_subscribers (lower(email));

ALTER TABLE public.reminder_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anonymous guests) can subscribe themselves.
DROP POLICY IF EXISTS "Anyone can subscribe to reminders" ON public.reminder_subscribers;
CREATE POLICY "Anyone can subscribe to reminders"
ON public.reminder_subscribers
FOR INSERT
TO public
WITH CHECK (true);

-- Only admins can read the subscriber list.
DROP POLICY IF EXISTS "Admins read reminders" ON public.reminder_subscribers;
CREATE POLICY "Admins read reminders"
ON public.reminder_subscribers
FOR SELECT
TO public
USING (has_role(auth.uid(), 'admin'::app_role));

-- Subscribers can deactivate themselves only if they have a matching user_id.
DROP POLICY IF EXISTS "Users can deactivate own reminder" ON public.reminder_subscribers;
CREATE POLICY "Users can deactivate own reminder"
ON public.reminder_subscribers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

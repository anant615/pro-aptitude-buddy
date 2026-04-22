CREATE POLICY "Admins update dpps"
ON public.dpps
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.renumber_dpp_questions(_date date, _title text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  WITH ordered AS (
    SELECT id,
           ROW_NUMBER() OVER (
             ORDER BY COALESCE(q_number, 2147483647), created_at, id
           ) AS new_q_number
    FROM public.dpps
    WHERE date = _date
      AND title = _title
  )
  UPDATE public.dpps d
  SET q_number = ordered.new_q_number
  FROM ordered
  WHERE d.id = ordered.id;
END;
$$;
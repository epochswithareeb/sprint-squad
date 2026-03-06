
CREATE TABLE public.leaves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  leave_date date NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, leave_date)
);

ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own leaves admins all"
ON public.leaves FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users can request leaves"
ON public.leaves FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update leaves"
ON public.leaves FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can cancel pending leaves"
ON public.leaves FOR DELETE TO authenticated
USING (user_id = auth.uid() AND status = 'pending');

CREATE TRIGGER update_leaves_updated_at
  BEFORE UPDATE ON public.leaves
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

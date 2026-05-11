
CREATE TABLE public.sprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX sprints_one_active ON public.sprints (status) WHERE status = 'active';

ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view sprints"
  ON public.sprints FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can create sprints"
  ON public.sprints FOR INSERT TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update sprints"
  ON public.sprints FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete sprints"
  ON public.sprints FOR DELETE TO authenticated
  USING (is_admin(auth.uid()));

CREATE TRIGGER update_sprints_updated_at
  BEFORE UPDATE ON public.sprints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.tickets ADD COLUMN sprint_id uuid REFERENCES public.sprints(id) ON DELETE SET NULL;
CREATE INDEX idx_tickets_sprint_id ON public.tickets(sprint_id);

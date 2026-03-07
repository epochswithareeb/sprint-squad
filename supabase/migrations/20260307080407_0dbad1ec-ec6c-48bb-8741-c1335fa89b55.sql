
-- Create ticket_assignees junction table first
CREATE TABLE IF NOT EXISTS public.ticket_assignees (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(ticket_id, user_id)
);

ALTER TABLE public.ticket_assignees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their assignments admins all" ON public.ticket_assignees
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage assignments" ON public.ticket_assignees
  FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- Now fix tickets policies to include multi-assignee
DROP POLICY IF EXISTS "Users can view assigned tickets or all if admin" ON public.tickets;
CREATE POLICY "Users can view assigned tickets or all if admin" ON public.tickets
  FOR SELECT TO authenticated USING (
    is_admin(auth.uid()) OR assigned_to = auth.uid() OR created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.ticket_assignees ta WHERE ta.ticket_id = tickets.id AND ta.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can update any ticket users can update assigned" ON public.tickets;
CREATE POLICY "Admins can update any ticket users can update assigned" ON public.tickets
  FOR UPDATE TO authenticated USING (
    is_admin(auth.uid()) OR assigned_to = auth.uid()
    OR EXISTS (SELECT 1 FROM public.ticket_assignees ta WHERE ta.ticket_id = tickets.id AND ta.user_id = auth.uid())
  );

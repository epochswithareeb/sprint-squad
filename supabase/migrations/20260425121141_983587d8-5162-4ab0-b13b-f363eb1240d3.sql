
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS pr_reviewer TEXT;

CREATE TABLE IF NOT EXISTS public.ticket_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on accessible tickets"
ON public.ticket_comments FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.tickets t
  WHERE t.id = ticket_comments.ticket_id
    AND (
      public.is_admin(auth.uid())
      OR t.assigned_to = auth.uid()
      OR t.created_by = auth.uid()
      OR EXISTS (SELECT 1 FROM public.ticket_assignees ta WHERE ta.ticket_id = t.id AND ta.user_id = auth.uid())
    )
));

CREATE POLICY "Users can add comments to accessible tickets"
ON public.ticket_comments FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = ticket_comments.ticket_id
      AND (
        public.is_admin(auth.uid())
        OR t.assigned_to = auth.uid()
        OR t.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.ticket_assignees ta WHERE ta.ticket_id = t.id AND ta.user_id = auth.uid())
      )
  )
);

CREATE POLICY "Users can update their own comments"
ON public.ticket_comments FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments admins all"
ON public.ticket_comments FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE TRIGGER update_ticket_comments_updated_at
BEFORE UPDATE ON public.ticket_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket ON public.ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_tickets_pr_reviewer ON public.tickets(pr_reviewer);

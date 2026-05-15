
CREATE TABLE public.ticket_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  content_type TEXT,
  size BIGINT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ticket_attachments_ticket ON public.ticket_attachments(ticket_id);

ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments on accessible tickets"
ON public.ticket_attachments FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.tickets t
  WHERE t.id = ticket_attachments.ticket_id
    AND (
      public.is_admin(auth.uid())
      OR t.assigned_to = auth.uid()
      OR t.created_by = auth.uid()
      OR EXISTS (SELECT 1 FROM public.ticket_assignees ta WHERE ta.ticket_id = t.id AND ta.user_id = auth.uid())
    )
));

CREATE POLICY "Admins can add attachments"
ON public.ticket_attachments FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()) AND uploaded_by = auth.uid());

CREATE POLICY "Admins can delete attachments"
ON public.ticket_attachments FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view ticket attachment files"
ON storage.objects FOR SELECT
USING (bucket_id = 'ticket-attachments');

CREATE POLICY "Admins can upload ticket attachment files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ticket-attachments' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete ticket attachment files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ticket-attachments' AND public.is_admin(auth.uid()));

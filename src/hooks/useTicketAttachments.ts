import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TicketAttachment {
  id: string;
  ticket_id: string;
  file_name: string;
  file_path: string;
  content_type: string | null;
  size: number | null;
  uploaded_by: string;
  created_at: string;
  url?: string;
}

const BUCKET = 'ticket-attachments';

export function useTicketAttachments(ticketId: string | null) {
  return useQuery({
    queryKey: ['ticket-attachments', ticketId],
    enabled: !!ticketId,
    queryFn: async (): Promise<TicketAttachment[]> => {
      const { data, error } = await supabase
        .from('ticket_attachments')
        .select('*')
        .eq('ticket_id', ticketId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(a => ({
        ...a,
        url: supabase.storage.from(BUCKET).getPublicUrl(a.file_path).data.publicUrl,
      }));
    },
    staleTime: 15000,
  });
}

export function useUploadAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticket_id, file, user_id }: { ticket_id: string; file: File; user_id: string }) => {
      const safeName = file.name.replace(/[^\w.\-]+/g, '_');
      const path = `${ticket_id}/${Date.now()}_${safeName}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type || undefined,
        upsert: false,
      });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from('ticket_attachments').insert({
        ticket_id,
        file_name: file.name,
        file_path: path,
        content_type: file.type || null,
        size: file.size,
        uploaded_by: user_id,
      });
      if (insErr) throw insErr;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-attachments', vars.ticket_id] });
      toast.success('Attachment uploaded');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to upload attachment'),
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file_path, ticket_id: _t }: { id: string; file_path: string; ticket_id: string }) => {
      await supabase.storage.from(BUCKET).remove([file_path]);
      const { error } = await supabase.from('ticket_attachments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-attachments', vars.ticket_id] });
      toast.success('Attachment removed');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to remove attachment'),
  });
}
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type TicketStatus = 'wip' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high';

export interface Ticket {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  project_id: string;
  assigned_to: string | null;
  is_code_red: boolean;
  due_date: string | null;
  created_at: string;
  project?: { name: string };
  assignee?: { email: string; full_name: string | null };
}

export interface Project {
  id: string;
  name: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
}

// Fetch all tickets with project and assignee info
async function fetchTicketsData() {
  const [ticketsRes, projectsRes, usersRes] = await Promise.all([
    supabase.from('tickets').select('*').order('created_at', { ascending: false }),
    supabase.from('projects').select('id, name'),
    supabase.from('profiles').select('id, email, full_name'),
  ]);

  if (ticketsRes.error) throw ticketsRes.error;
  if (projectsRes.error) throw projectsRes.error;
  if (usersRes.error) throw usersRes.error;

  const projectMap = new Map(projectsRes.data?.map(p => [p.id, p]) || []);
  const userMap = new Map(usersRes.data?.map(u => [u.id, u]) || []);

  const tickets: Ticket[] = (ticketsRes.data || []).map(ticket => ({
    ...ticket,
    project: projectMap.get(ticket.project_id) ? { name: projectMap.get(ticket.project_id)!.name } : undefined,
    assignee: userMap.get(ticket.assigned_to || '') ? {
      email: userMap.get(ticket.assigned_to!)!.email,
      full_name: userMap.get(ticket.assigned_to!)!.full_name,
    } : undefined,
  }));

  return {
    tickets,
    projects: projectsRes.data || [],
    users: usersRes.data || [],
  };
}

export function useTicketsData() {
  return useQuery({
    queryKey: ['tickets-data'],
    queryFn: fetchTicketsData,
    staleTime: 30000, // 30 seconds
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ticket: {
      title: string;
      description: string | null;
      project_id: string;
      priority: TicketPriority;
      assigned_to: string | null;
      due_date: string | null;
      created_by: string;
    }) => {
      const { error } = await supabase.from('tickets').insert(ticket);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets-data'] });
      toast.success('Ticket created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create ticket');
    },
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ticketId, status, resolved_at, closed_at }: {
      ticketId: string;
      status: TicketStatus;
      resolved_at?: string | null;
      closed_at?: string | null;
    }) => {
      const updateData: Record<string, unknown> = { status };
      if (resolved_at !== undefined) updateData.resolved_at = resolved_at;
      if (closed_at !== undefined) updateData.closed_at = closed_at;
      
      const { error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', ticketId);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['tickets-data'] });
      const message = status === 'resolved' ? 'Ticket marked as resolved' : 
                      status === 'closed' ? 'Ticket closed' : 'Ticket updated';
      toast.success(message);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update ticket');
    },
  });
}

export function useEscalateTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ticketId: string) => {
      const { error } = await supabase
        .from('tickets')
        .update({ is_code_red: true })
        .eq('id', ticketId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets-data'] });
      toast.success('Ticket escalated to Code Red');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to escalate ticket');
    },
  });
}

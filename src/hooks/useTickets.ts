import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type TicketStatus = 'assigned' | 'wip' | 'closed';
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
  closed_at: string | null;
  pr_reviewer: string | null;
  project?: { name: string };
  assignee?: { email: string; full_name: string | null };
  additionalAssignees?: { id: string; email: string; full_name: string | null }[];
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

async function fetchTicketsData() {
  const [ticketsRes, projectsRes, usersRes, assigneesRes] = await Promise.all([
    supabase.from('tickets').select('*').order('created_at', { ascending: false }),
    supabase.from('projects').select('id, name'),
    supabase.from('profiles').select('id, email, full_name'),
    supabase.from('ticket_assignees').select('*'),
  ]);

  if (ticketsRes.error) throw ticketsRes.error;
  if (projectsRes.error) throw projectsRes.error;
  if (usersRes.error) throw usersRes.error;

  const projectMap = new Map(projectsRes.data?.map(p => [p.id, p]) || []);
  const userMap = new Map(usersRes.data?.map(u => [u.id, u]) || []);

  const assigneesByTicket = new Map<string, string[]>();
  (assigneesRes.data || []).forEach(a => {
    const list = assigneesByTicket.get(a.ticket_id) || [];
    list.push(a.user_id);
    assigneesByTicket.set(a.ticket_id, list);
  });

  const tickets: Ticket[] = (ticketsRes.data || []).map(ticket => {
    const extraIds = assigneesByTicket.get(ticket.id) || [];
    return {
      ...ticket,
      project: projectMap.get(ticket.project_id) ? { name: projectMap.get(ticket.project_id)!.name } : undefined,
      assignee: userMap.get(ticket.assigned_to || '') ? {
        email: userMap.get(ticket.assigned_to!)!.email,
        full_name: userMap.get(ticket.assigned_to!)!.full_name,
      } : undefined,
      additionalAssignees: extraIds
        .filter(id => id !== ticket.assigned_to)
        .map(id => userMap.get(id))
        .filter(Boolean)
        .map(u => ({ id: u!.id, email: u!.email, full_name: u!.full_name })),
    };
  });

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
    staleTime: 30000,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      title: string;
      description: string | null;
      project_id: string;
      priority: TicketPriority;
      assigned_to: string | null;
      due_date: string | null;
      created_by: string;
      additional_assignees?: string[];
    }) => {
      const { additional_assignees, ...ticket } = params;
      const { data, error } = await supabase.from('tickets').insert(ticket).select('id').single();
      if (error) throw error;

      if (additional_assignees?.length && data) {
        const rows = additional_assignees.map(user_id => ({
          ticket_id: data.id,
          user_id,
        }));
        const { error: aError } = await supabase.from('ticket_assignees').insert(rows);
        if (aError) throw aError;
      }
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
    mutationFn: async ({ ticketId, status, closed_at, pr_reviewer }: {
      ticketId: string;
      status: TicketStatus;
      closed_at?: string | null;
      pr_reviewer?: string | null;
    }) => {
      const updateData: Record<string, unknown> = { status };
      if (closed_at !== undefined) updateData.closed_at = closed_at;
      if (pr_reviewer !== undefined) updateData.pr_reviewer = pr_reviewer;
      
      const { error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', ticketId);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['tickets-data'] });
      const message = status === 'wip' ? 'Ticket marked as Work In Progress' : 
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

export interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: { email: string; full_name: string | null };
}

export function useTicketComments(ticketId: string | null) {
  return useQuery({
    queryKey: ['ticket-comments', ticketId],
    enabled: !!ticketId,
    queryFn: async (): Promise<TicketComment[]> => {
      const { data, error } = await supabase
        .from('ticket_comments')
        .select('*')
        .eq('ticket_id', ticketId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      const userIds = Array.from(new Set((data || []).map(c => c.user_id)));
      let authorMap = new Map<string, { email: string; full_name: string | null }>();
      if (userIds.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds);
        authorMap = new Map((profiles || []).map(p => [p.id, { email: p.email, full_name: p.full_name }]));
      }
      return (data || []).map(c => ({ ...c, author: authorMap.get(c.user_id) }));
    },
    staleTime: 15000,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticket_id, user_id, content }: { ticket_id: string; user_id: string; content: string }) => {
      const { error } = await supabase
        .from('ticket_comments')
        .insert({ ticket_id, user_id, content });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-comments', vars.ticket_id] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add comment');
    },
  });
}

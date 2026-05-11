import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Cast supabase to permissive shape so newly-added tables/columns work
// even if generated types haven't caught up yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export interface Sprint {
  id: string;
  name: string;
  status: 'active' | 'ended' | 'cancelled';
  started_at: string;
  ended_at: string | null;
  created_by: string;
}

export function useActiveSprint() {
  return useQuery({
    queryKey: ['active-sprint'],
    queryFn: async (): Promise<Sprint | null> => {
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('status', 'active')
        .maybeSingle();
      if (error) throw error;
      return (data as Sprint | null) ?? null;
    },
    staleTime: 30000,
  });
}

export function useAllSprints() {
  return useQuery({
    queryKey: ['sprints'],
    queryFn: async (): Promise<Sprint[]> => {
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .order('started_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Sprint[];
    },
    staleTime: 30000,
  });
}

export function useStartSprint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, created_by }: { name: string; created_by: string }) => {
      const { error } = await sb.from('sprints').insert({ name, created_by, status: 'active' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-sprint'] });
      qc.invalidateQueries({ queryKey: ['sprints'] });
      toast.success('Sprint started');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to start sprint'),
  });
}

export function useEndSprint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, cancel }: { id: string; cancel?: boolean }) => {
      const { error } = await supabase
        .from('sprints')
        .update({ status: cancel ? 'cancelled' : 'ended', ended_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['active-sprint'] });
      qc.invalidateQueries({ queryKey: ['sprints'] });
      qc.invalidateQueries({ queryKey: ['sprint-tickets'] });
      qc.invalidateQueries({ queryKey: ['tickets-data'] });
      toast.success(vars.cancel ? 'Sprint cancelled' : 'Sprint ended');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to end sprint'),
  });
}

export interface SprintTicket {
  id: string;
  title: string;
  description: string | null;
  status: 'assigned' | 'wip' | 'closed';
  priority: 'low' | 'medium' | 'high';
  sprint_id: string;
  assigned_to: string | null;
  closed_at: string | null;
  created_at: string;
  project_id: string;
}

export function useSprintTickets(sprintId: string | null | undefined) {
  return useQuery({
    queryKey: ['sprint-tickets', sprintId],
    enabled: !!sprintId,
    queryFn: async (): Promise<SprintTicket[]> => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('sprint_id', sprintId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as SprintTicket[];
    },
    staleTime: 15000,
  });
}

export function useCreateSprintTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      sprint_id: string;
      title: string;
      description: string | null;
      project_id: string;
      priority: 'low' | 'medium' | 'high';
      assigned_to: string;
      created_by: string;
    }) => {
      const { error } = await sb.from('tickets').insert(params);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['sprint-tickets', vars.sprint_id] });
      qc.invalidateQueries({ queryKey: ['tickets-data'] });
      toast.success('Sprint ticket created');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to create sprint ticket'),
  });
}

export function useUpdateSprintTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, sprint_id }: { id: string; status: 'assigned'|'wip'|'closed'; sprint_id: string }) => {
      const update: Record<string, unknown> = { status };
      if (status === 'closed') update.closed_at = new Date().toISOString();
      const { error } = await sb.from('tickets').update(update).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['sprint-tickets', vars.sprint_id] });
      qc.invalidateQueries({ queryKey: ['tickets-data'] });
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to update'),
  });
}
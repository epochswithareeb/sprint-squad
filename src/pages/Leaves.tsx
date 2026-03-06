import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  CalendarDays, Plus, CheckCircle, XCircle, Clock, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

const statusStyles = {
  pending: { label: 'Pending', variant: 'status-pending' as const, icon: Clock },
  approved: { label: 'Approved', variant: 'status-resolved' as const, icon: CheckCircle },
  rejected: { label: 'Rejected', variant: 'secondary' as const, icon: XCircle },
};

async function fetchLeaves(isAdmin: boolean) {
  const [leavesRes, profilesRes] = await Promise.all([
    supabase.from('leaves').select('*').order('leave_date', { ascending: true }),
    supabase.from('profiles').select('id, email, full_name'),
  ]);
  if (leavesRes.error) throw leavesRes.error;
  if (profilesRes.error) throw profilesRes.error;

  const profileMap = new Map(profilesRes.data?.map(p => [p.id, p]) || []);
  return {
    leaves: (leavesRes.data || []).map(l => ({
      ...l,
      user: profileMap.get(l.user_id),
    })),
    profiles: profilesRes.data || [],
  };
}

export default function Leaves() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [leaveDate, setLeaveDate] = useState('');
  const [reason, setReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['leaves'],
    queryFn: () => fetchLeaves(isAdmin),
    staleTime: 15000,
  });

  const applyLeave = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('leaves').insert({
        user_id: user!.id,
        leave_date: leaveDate,
        reason: reason || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      toast.success('Leave request submitted');
      setIsDialogOpen(false);
      setLeaveDate('');
      setReason('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateLeave = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('leaves').update({
        status,
        approved_by: user!.id,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      toast.success(`Leave ${status}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteLeave = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leaves').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      toast.success('Leave cancelled');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const leaves = data?.leaves || [];

  const { pendingCount, approvedCount } = useMemo(() => ({
    pendingCount: leaves.filter(l => l.status === 'pending').length,
    approvedCount: leaves.filter(l => l.status === 'approved').length,
  }), [leaves]);

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary/50 rounded w-48" />
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-secondary/50 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CalendarDays className="h-8 w-8 text-primary" />
            {isAdmin ? 'Leave Management' : 'My Leaves'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin ? 'Review and approve leave requests' : 'Apply for leaves and track status'}
          </p>
        </div>

        {!isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero">
                <Plus className="h-4 w-4 mr-2" />
                Apply for Leave
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Apply for Leave</DialogTitle>
                <DialogDescription>Submit a leave request for admin approval.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Leave Date *</Label>
                  <Input type="date" value={leaveDate} onChange={e => setLeaveDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Textarea placeholder="Reason for leave..." value={reason}
                    onChange={e => setReason(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => applyLeave.mutate()} disabled={!leaveDate || applyLeave.isPending}>
                  {applyLeave.isPending ? 'Submitting...' : 'Submit Request'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{leaves.length}</p>
              <p className="text-sm text-muted-foreground">Total Requests</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{approvedCount}</p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaves List */}
      <div className="space-y-3">
        {leaves.length > 0 ? leaves.map((leave, i) => {
          const cfg = statusStyles[leave.status as keyof typeof statusStyles] || statusStyles.pending;
          const Icon = cfg.icon;
          return (
            <Card key={leave.id} hover className="animate-fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {isAdmin && leave.user && (
                        <span className="font-semibold">{leave.user.full_name || leave.user.email}</span>
                      )}
                      <Badge variant={cfg.variant}>
                        <Icon className="h-3 w-3 mr-1" />
                        {cfg.label}
                      </Badge>
                    </div>
                    <p className="text-lg font-medium">
                      {new Date(leave.leave_date + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                    {leave.reason && (
                      <p className="text-sm text-muted-foreground mt-1">{leave.reason}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {isAdmin && leave.status === 'pending' && (
                      <>
                        <Button variant="success" size="sm"
                          onClick={() => updateLeave.mutate({ id: leave.id, status: 'approved' })}
                          disabled={updateLeave.isPending}>
                          <CheckCircle className="h-3 w-3 mr-1" /> Approve
                        </Button>
                        <Button variant="destructive" size="sm"
                          onClick={() => updateLeave.mutate({ id: leave.id, status: 'rejected' })}
                          disabled={updateLeave.isPending}>
                          <XCircle className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                    {!isAdmin && leave.status === 'pending' && (
                      <Button variant="ghost" size="sm"
                        onClick={() => deleteLeave.mutate(leave.id)}
                        disabled={deleteLeave.isPending}>
                        <Trash2 className="h-3 w-3 mr-1" /> Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        }) : (
          <Card className="py-12">
            <CardContent className="text-center">
              <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-lg mb-1">No leave requests</h3>
              <p className="text-muted-foreground text-sm">
                {isAdmin ? 'No leave requests to review' : 'Apply for a leave to get started'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

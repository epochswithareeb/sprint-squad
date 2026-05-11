import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Zap, Plus, Play, CheckCircle, StopCircle, Trophy, User, Eye, MessageSquare, Send } from 'lucide-react';
import { useTicketsData, useTicketComments, useAddComment } from '@/hooks/useTickets';
import {
  useActiveSprint, useStartSprint, useEndSprint,
  useSprintTickets, useCreateSprintTicket, useUpdateSprintTicket,
  type SprintTicket,
} from '@/hooks/useSprint';

export default function Sprint() {
  const { isAdmin, user } = useAuth();
  const { data: sprint, isLoading: sLoading } = useActiveSprint();
  const { data: tdata } = useTicketsData();
  const { data: sprintTickets = [] } = useSprintTickets(sprint?.id);
  const startSprint = useStartSprint();
  const endSprint = useEndSprint();
  const createTicket = useCreateSprintTicket();
  const updateTicket = useUpdateSprintTicket();

  const [openStart, setOpenStart] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [sprintName, setSprintName] = useState('');
  const [viewTicket, setViewTicket] = useState<SprintTicket | null>(null);
  const [commentText, setCommentText] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', project_id: '', priority: 'medium' as 'low'|'medium'|'high', assigned_to: '',
  });

  const { data: comments = [] } = useTicketComments(viewTicket?.id ?? null);
  const addComment = useAddComment();

  const projects = tdata?.projects || [];
  const users = tdata?.users || [];
  const userMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

  const myTickets = useMemo(
    () => isAdmin ? sprintTickets : sprintTickets.filter(t => t.assigned_to === user?.id),
    [sprintTickets, isAdmin, user?.id]
  );

  const stats = useMemo(() => {
    const map = new Map<string, { name: string; assigned: number; wip: number; closed: number; total: number }>();
    sprintTickets.forEach(t => {
      if (!t.assigned_to) return;
      const u = userMap.get(t.assigned_to);
      const name = u?.full_name || u?.email || 'Unknown';
      const cur = map.get(t.assigned_to) || { name, assigned: 0, wip: 0, closed: 0, total: 0 };
      cur[t.status] += 1;
      cur.total += 1;
      map.set(t.assigned_to, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.closed - a.closed);
  }, [sprintTickets, userMap]);

  const allClosed = sprintTickets.length > 0 && sprintTickets.every(t => t.status === 'closed');

  const handleStart = () => {
    if (!sprintName.trim() || !user?.id) return;
    startSprint.mutate({ name: sprintName.trim(), created_by: user.id }, {
      onSuccess: () => { setOpenStart(false); setSprintName(''); }
    });
  };

  const handleCreate = () => {
    if (!sprint || !form.title.trim() || !form.project_id || !form.assigned_to || !user?.id) return;
    createTicket.mutate({
      sprint_id: sprint.id,
      title: form.title.trim(),
      description: form.description || null,
      project_id: form.project_id,
      priority: form.priority,
      assigned_to: form.assigned_to,
      created_by: user.id,
    }, {
      onSuccess: () => {
        setOpenCreate(false);
        setForm({ title: '', description: '', project_id: '', priority: 'medium', assigned_to: '' });
      }
    });
  };

  const handleSubmitComment = useCallback(() => {
    if (!viewTicket || !commentText.trim() || !user?.id) return;
    addComment.mutate(
      { ticket_id: viewTicket.id, user_id: user.id, content: commentText.trim() },
      { onSuccess: () => setCommentText('') }
    );
  }, [viewTicket, commentText, user?.id, addComment]);

  const projectMap = useMemo(() => new Map((tdata?.projects || []).map(p => [p.id, p])), [tdata?.projects]);

  if (sLoading) return <div className="p-8 text-muted-foreground">Loading sprint…</div>;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Zap className="h-8 w-8 text-sprint" />
            <span style={{ color: 'hsl(var(--sprint))' }}>Sprint Mode</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {sprint ? `Active sprint: ${sprint.name}` : 'No active sprint'}
          </p>
        </div>
        {isAdmin && !sprint && (
          <Dialog open={openStart} onOpenChange={setOpenStart}>
            <DialogTrigger asChild>
              <Button variant="sprint"><Play className="h-4 w-4" />Start Sprint</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Start a New Sprint</DialogTitle></DialogHeader>
              <div className="space-y-2 py-4">
                <Label>Sprint Name</Label>
                <Input value={sprintName} onChange={e => setSprintName(e.target.value)} placeholder="e.g. Sprint 12 — Q2 Push" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenStart(false)}>Cancel</Button>
                <Button variant="sprint" onClick={handleStart} disabled={startSprint.isPending}>Start</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        {isAdmin && sprint && (
          <div className="flex gap-2 flex-wrap">
            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
              <DialogTrigger asChild>
                <Button variant="sprint"><Plus className="h-4 w-4" />Add Sprint Ticket</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>New Sprint Ticket</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Project</Label>
                    <Select value={form.project_id} onValueChange={v => setForm({...form, project_id: v})}>
                      <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                      <SelectContent>
                        {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select value={form.priority} onValueChange={(v: 'low'|'medium'|'high') => setForm({...form, priority: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Assign To</Label>
                      <Select value={form.assigned_to} onValueChange={v => setForm({...form, assigned_to: v})}>
                        <SelectTrigger><SelectValue placeholder="User" /></SelectTrigger>
                        <SelectContent>
                          {users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenCreate(false)}>Cancel</Button>
                  <Button variant="sprint" onClick={handleCreate} disabled={createTicket.isPending}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              onClick={() => endSprint.mutate({ id: sprint.id, cancel: true })}
              disabled={endSprint.isPending}
            >
              <StopCircle className="h-4 w-4" />Cancel Sprint
            </Button>
            <Button
              variant="success"
              onClick={() => endSprint.mutate({ id: sprint.id })}
              disabled={endSprint.isPending}
            >
              <Trophy className="h-4 w-4" />End Sprint
            </Button>
          </div>
        )}
      </div>

      {sprint && allClosed && (
        <Card className="border-sprint/40" style={{ background: 'hsl(var(--sprint) / 0.08)' }}>
          <CardContent className="p-4 flex items-center gap-3">
            <Trophy className="h-6 w-6 text-sprint" />
            <div>
              <p className="font-semibold">All sprint tickets are closed!</p>
              <p className="text-sm text-muted-foreground">Admin can end the sprint to lock in the leaderboard.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {sprint && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-lg font-semibold">{isAdmin ? 'Sprint Tickets' : 'My Sprint Tickets'}</h2>
            {myTickets.length === 0 && (
              <Card><CardContent className="p-6 text-center text-muted-foreground">No sprint tickets yet.</CardContent></Card>
            )}
            {myTickets.map(t => {
              const u = t.assigned_to ? userMap.get(t.assigned_to) : null;
              return (
                <Card key={t.id} className="border-sprint/30" style={{ background: 'hsl(var(--sprint) / 0.05)' }}>
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">{t.title}</h3>
                        {t.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{t.description}</p>}
                        {u && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><User className="h-3 w-3" />{u.full_name || u.email}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge style={{ background: 'hsl(var(--sprint) / 0.2)', color: 'hsl(var(--sprint))', borderColor: 'hsl(var(--sprint) / 0.4)' }} variant="outline">
                          {t.status === 'wip' ? 'In Progress' : t.status === 'closed' ? 'Closed' : 'Assigned'}
                        </Badge>
                        <Button size="sm" variant="outline" onClick={() => setViewTicket(t)}>
                          <Eye className="h-3 w-3 mr-1" />View
                        </Button>
                        {t.status === 'assigned' && (t.assigned_to === user?.id || isAdmin) && (
                          <Button size="sm" variant="sprint" onClick={() => updateTicket.mutate({ id: t.id, status: 'wip', sprint_id: sprint.id })}>
                            <Play className="h-3 w-3" />Start
                          </Button>
                        )}
                        {t.status === 'wip' && (t.assigned_to === user?.id || isAdmin) && (
                          <Button size="sm" variant="sprint" onClick={() => updateTicket.mutate({ id: t.id, status: 'closed', sprint_id: sprint.id })}>
                            <CheckCircle className="h-3 w-3" />Close
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Trophy className="h-4 w-4 text-sprint" />Leaderboard</h2>
            <Card><CardContent className="p-4 space-y-3">
              {stats.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
              {stats.map((s, i) => (
                <div key={s.name} className="flex items-center justify-between gap-3 pb-2 border-b border-border last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-mono text-muted-foreground w-6">#{i + 1}</span>
                    <span className="text-sm truncate">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span style={{ color: 'hsl(var(--sprint))' }} className="font-semibold">{s.closed}</span>
                    <span className="text-muted-foreground">/ {s.total}</span>
                  </div>
                </div>
              ))}
            </CardContent></Card>
          </div>
        </div>
      )}

      {!sprint && !isAdmin && (
        <Card><CardContent className="p-12 text-center text-muted-foreground">
          No sprint is currently running. The admin will start one soon.
        </CardContent></Card>
      )}
    </div>
  );
}
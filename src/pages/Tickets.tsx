import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { 
  Ticket as TicketIcon, Plus, Search, Filter, AlertTriangle,
  Calendar, User, CheckCircle, Eye, History, Play, MessageSquare, Send,
} from 'lucide-react';
import {
  useTicketsData, useCreateTicket, useUpdateTicketStatus, useEscalateTicket,
  useTicketComments, useAddComment,
  type Ticket, type TicketPriority,
} from '@/hooks/useTickets';

const PR_REVIEWERS = ['Administrator', 'Areeb Ahmad', 'Prince Kumar', 'Princy'] as const;

const statusConfig = {
  assigned: { label: 'Assigned', variant: 'status-pending' as const },
  wip: { label: 'Work In Progress', variant: 'status-wip' as const },
  closed: { label: 'Closed', variant: 'secondary' as const },
};

const priorityConfig = {
  low: { label: 'Low', variant: 'priority-low' as const },
  medium: { label: 'Medium', variant: 'priority-medium' as const },
  high: { label: 'High', variant: 'priority-high' as const },
};

export default function Tickets() {
  const { isAdmin, user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewTicket, setViewTicket] = useState<Ticket | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('active');
  const [commentText, setCommentText] = useState('');
  const [prReviewer, setPrReviewer] = useState<string>('');
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closingTicketId, setClosingTicketId] = useState<string | null>(null);
  
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    project_id: '',
    priority: 'medium' as TicketPriority,
    assigned_to: '',
    additional_assignees: [] as string[],
    due_date: '',
  });

  const { data, isLoading } = useTicketsData();
  const createTicket = useCreateTicket();
  const updateStatus = useUpdateTicketStatus();
  const escalateTicket = useEscalateTicket();
  const { data: comments = [] } = useTicketComments(viewTicket?.id ?? null);
  const addComment = useAddComment();

  const tickets = data?.tickets || [];
  const projects = data?.projects || [];
  const users = data?.users || [];

  const handleCreateTicket = useCallback(async () => {
    if (!newTicket.title.trim() || !newTicket.project_id) return;

    createTicket.mutate({
      title: newTicket.title,
      description: newTicket.description || null,
      project_id: newTicket.project_id,
      priority: newTicket.priority,
      assigned_to: newTicket.assigned_to || null,
      due_date: newTicket.due_date || null,
      created_by: user?.id || '',
      additional_assignees: newTicket.additional_assignees,
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setNewTicket({
          title: '', description: '', project_id: '',
          priority: 'medium', assigned_to: '', additional_assignees: [], due_date: '',
        });
      }
    });
  }, [newTicket, user?.id, createTicket]);

  const handleStartWork = useCallback((ticketId: string) => {
    updateStatus.mutate({ ticketId, status: 'wip' });
  }, [updateStatus]);

  const requestCloseTicket = useCallback((ticketId: string) => {
    setClosingTicketId(ticketId);
    setPrReviewer('');
    setCloseDialogOpen(true);
  }, []);

  const confirmCloseTicket = useCallback(() => {
    if (!closingTicketId || !prReviewer) return;
    updateStatus.mutate({
      ticketId: closingTicketId,
      status: 'closed',
      closed_at: new Date().toISOString(),
      pr_reviewer: prReviewer,
    }, {
      onSuccess: () => {
        setCloseDialogOpen(false);
        setClosingTicketId(null);
        setPrReviewer('');
        setViewTicket(null);
      }
    });
  }, [closingTicketId, prReviewer, updateStatus]);

  const handleSubmitComment = useCallback(() => {
    if (!viewTicket || !commentText.trim() || !user?.id) return;
    addComment.mutate(
      { ticket_id: viewTicket.id, user_id: user.id, content: commentText.trim() },
      { onSuccess: () => setCommentText('') }
    );
  }, [viewTicket, commentText, user?.id, addComment]);

  const handleEscalate = useCallback((ticketId: string) => {
    escalateTicket.mutate(ticketId);
  }, [escalateTicket]);

  // Split tickets into active and history (closed)
  const { activeTickets, historyTickets } = useMemo(() => {
    const active: Ticket[] = [];
    const history: Ticket[] = [];
    tickets.forEach(t => {
      if (t.status === 'closed') history.push(t);
      else active.push(t);
    });
    return { activeTickets: active, historyTickets: history };
  }, [tickets]);

  const filterTickets = (list: Ticket[]) =>
    list.filter(ticket => {
      const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

  const filteredActive = useMemo(() => filterTickets(activeTickets), [activeTickets, searchQuery, statusFilter]);
  const filteredHistory = useMemo(() => filterTickets(historyTickets), [historyTickets, searchQuery, statusFilter]);

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary/50 rounded w-48" />
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-secondary/50 rounded-lg" />)}
        </div>
      </div>
    );
  }

  const renderTicketCard = (ticket: Ticket, index: number, showActions: boolean) => (
    <Card 
      key={ticket.id} 
      hover 
      codeRed={ticket.is_code_red}
      className="animate-fade-in"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-mono text-muted-foreground">{ticket.id.slice(0, 8)}</span>
              {ticket.is_code_red && (
                <Badge variant="code-red" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />Code Red
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-lg truncate">{ticket.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
              {ticket.description || 'No description'}
            </p>
            {ticket.project && (
              <p className="text-xs text-muted-foreground mt-1">Project: {ticket.project.name}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Badge variant={priorityConfig[ticket.priority].variant}>
              {priorityConfig[ticket.priority].label}
            </Badge>
            <Badge variant={statusConfig[ticket.status].variant}>
              {statusConfig[ticket.status].label}
            </Badge>
            {ticket.assignee && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{ticket.assignee.full_name || ticket.assignee.email.split('@')[0]}</span>
              </div>
            )}
            {ticket.additionalAssignees && ticket.additionalAssignees.length > 0 && (
              <span className="text-muted-foreground">+{ticket.additionalAssignees.length} more</span>
            )}
            {ticket.due_date && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{new Date(ticket.due_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setViewTicket(ticket)}>
              <Eye className="h-3 w-3 mr-1" />View
            </Button>
            {showActions && ticket.status !== 'closed' && (
              <>
                {ticket.status === 'assigned' && (
                  <Button 
                    variant="default" size="sm"
                    onClick={() => handleStartWork(ticket.id)}
                    disabled={updateStatus.isPending}
                  >
                    <Play className="h-3 w-3 mr-1" />Start Work
                  </Button>
                )}
                {ticket.status === 'wip' && (
                  <Button 
                    variant="success" size="sm"
                    onClick={() => requestCloseTicket(ticket.id)}
                    disabled={updateStatus.isPending}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />Close Ticket
                  </Button>
                )}
                {!ticket.is_code_red && isAdmin && (
                  <Button 
                    variant="code-red" size="sm"
                    onClick={() => handleEscalate(ticket.id)}
                    disabled={escalateTicket.isPending}
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />Escalate
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const emptyState = (message: string) => (
    <Card className="py-12">
      <CardContent className="flex flex-col items-center justify-center text-center">
        <TicketIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="font-semibold text-lg mb-1">No tickets found</h3>
        <p className="text-muted-foreground text-sm">{message}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <TicketIcon className="h-8 w-8 text-primary" />
            {isAdmin ? 'All Tickets' : 'My Tickets'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin ? 'Manage and track all tickets across projects' : 'View and update your assigned tickets'}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero"><Plus className="h-4 w-4 mr-2" />New Ticket</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Ticket</DialogTitle>
                <DialogDescription>Create a ticket and assign it to a team member.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="project">Project *</Label>
                  <Select value={newTicket.project_id} onValueChange={v => setNewTicket({ ...newTicket, project_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                    <SelectContent>
                      {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" placeholder="Brief description of the issue" value={newTicket.title} onChange={e => setNewTicket({ ...newTicket, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Detailed description..." value={newTicket.description} onChange={e => setNewTicket({ ...newTicket, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={newTicket.priority} onValueChange={(v: TicketPriority) => setNewTicket({ ...newTicket, priority: v })}>
                      <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Assign To</Label>
                    <Select value={newTicket.assigned_to} onValueChange={v => setNewTicket({ ...newTicket, assigned_to: v })}>
                      <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                      <SelectContent>
                        {users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Additional Assignees</Label>
                  <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
                    {users.filter(u => u.id !== newTicket.assigned_to).map(u => {
                      const isSelected = newTicket.additional_assignees.includes(u.id);
                      return (
                        <Badge
                          key={u.id}
                          variant={isSelected ? 'default' : 'outline'}
                          className="cursor-pointer select-none"
                          onClick={() => setNewTicket(prev => ({
                            ...prev,
                            additional_assignees: isSelected
                              ? prev.additional_assignees.filter(id => id !== u.id)
                              : [...prev.additional_assignees, u.id],
                          }))}
                        >
                          {u.full_name || u.email.split('@')[0]}
                        </Badge>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">Click to toggle additional assignees</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input id="dueDate" type="date" value={newTicket.due_date} onChange={e => setNewTicket({ ...newTicket, due_date: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateTicket} disabled={createTicket.isPending}>
                  {createTicket.isPending ? 'Creating...' : 'Create Ticket'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tickets..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="wip">Work In Progress</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs: Active vs History */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active" className="gap-2">
            <TicketIcon className="h-4 w-4" />Active ({activeTickets.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />History ({historyTickets.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="space-y-4 mt-4">
          {filteredActive.length > 0
            ? filteredActive.map((t, i) => renderTicketCard(t, i, true))
            : emptyState(searchQuery || statusFilter !== 'all' ? 'Try adjusting your search or filters' : isAdmin ? 'Create a new ticket to get started' : 'No tickets have been assigned to you yet')}
        </TabsContent>
        <TabsContent value="history" className="space-y-4 mt-4">
          {filteredHistory.length > 0
            ? filteredHistory.map((t, i) => renderTicketCard(t, i, false))
            : emptyState('No closed tickets yet')}
        </TabsContent>
      </Tabs>

      {/* View Ticket Dialog */}
      <Dialog open={!!viewTicket} onOpenChange={open => { if (!open) setViewTicket(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
          {viewTicket && (
            <>
              <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-mono text-muted-foreground">{viewTicket.id.slice(0, 8)}</span>
                  {viewTicket.is_code_red && (
                    <Badge variant="code-red" className="gap-1"><AlertTriangle className="h-3 w-3" />Code Red</Badge>
                  )}
                </div>
                <DialogTitle className="text-xl">{viewTicket.title}</DialogTitle>
                <DialogDescription>
                  {viewTicket.project ? `Project: ${viewTicket.project.name}` : 'No project'}
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="flex-1 px-6">
              <div className="space-y-4 py-2 pr-2">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                  <div className="text-sm whitespace-pre-wrap break-words bg-muted/50 rounded-md p-3 max-h-72 overflow-y-auto">
                    {viewTicket.description || 'No description provided.'}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Status</span>
                    <div className="mt-1">
                      <Badge variant={statusConfig[viewTicket.status].variant}>
                        {statusConfig[viewTicket.status].label}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Priority</span>
                    <div className="mt-1">
                      <Badge variant={priorityConfig[viewTicket.priority].variant}>
                        {priorityConfig[viewTicket.priority].label}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Assigned To</span>
                    <p className="mt-1 font-medium">
                      {viewTicket.assignee ? (viewTicket.assignee.full_name || viewTicket.assignee.email) : 'Unassigned'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Due Date</span>
                    <p className="mt-1 font-medium">
                      {viewTicket.due_date ? new Date(viewTicket.due_date).toLocaleDateString() : 'No due date'}
                    </p>
                  </div>
                </div>

                {viewTicket.additionalAssignees && viewTicket.additionalAssignees.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <span className="text-sm text-muted-foreground">Additional Assignees</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {viewTicket.additionalAssignees.map(a => (
                          <Badge key={a.id} variant="outline">{a.full_name || a.email.split('@')[0]}</Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Created: {new Date(viewTicket.created_at).toLocaleString()}</p>
                  {viewTicket.closed_at && <p>Closed: {new Date(viewTicket.closed_at).toLocaleString()}</p>}
                  {viewTicket.pr_reviewer && <p>PR Reviewed by: {viewTicket.pr_reviewer}</p>}
                </div>

                <Separator />
                <div>
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4" />Comments ({comments.length})
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {comments.length === 0 && (
                      <p className="text-xs text-muted-foreground">No comments yet. Be the first to comment.</p>
                    )}
                    {comments.map(c => (
                      <div key={c.id} className="rounded-md border bg-muted/30 p-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span className="font-medium text-foreground">
                            {c.author?.full_name || c.author?.email?.split('@')[0] || 'User'}
                          </span>
                          <span>{new Date(c.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap break-words">{c.content}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Textarea
                      placeholder="Write a comment..."
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      className="min-h-[60px]"
                    />
                    <Button
                      onClick={handleSubmitComment}
                      disabled={!commentText.trim() || addComment.isPending}
                      size="icon"
                      className="self-end"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              </ScrollArea>

              <DialogFooter className="px-6 py-4 border-t shrink-0">
                {viewTicket.status === 'assigned' && (
                  <Button
                    variant="default"
                    onClick={() => { handleStartWork(viewTicket.id); setViewTicket(null); }}
                    disabled={updateStatus.isPending}
                  >
                    <Play className="h-4 w-4 mr-1" />Start Work
                  </Button>
                )}
                {viewTicket.status === 'wip' && (
                  <Button
                    variant="success"
                    onClick={() => requestCloseTicket(viewTicket.id)}
                    disabled={updateStatus.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />Close Ticket
                  </Button>
                )}
                <Button variant="outline" onClick={() => setViewTicket(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Close Ticket / PR Reviewer Dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={open => { if (!open) { setCloseDialogOpen(false); setClosingTicketId(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Close Ticket</DialogTitle>
            <DialogDescription>
              Please select who reviewed the PR for this ticket. This is required before closing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>PR Reviewed By *</Label>
            <Select value={prReviewer} onValueChange={setPrReviewer}>
              <SelectTrigger><SelectValue placeholder="Select reviewer" /></SelectTrigger>
              <SelectContent>
                {PR_REVIEWERS.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCloseDialogOpen(false); setClosingTicketId(null); }}>Cancel</Button>
            <Button
              variant="success"
              onClick={confirmCloseTicket}
              disabled={!prReviewer || updateStatus.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Confirm Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

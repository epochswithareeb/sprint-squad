import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Ticket as TicketIcon, 
  Plus, 
  Search,
  Filter,
  AlertTriangle,
  Calendar,
  User,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  useTicketsData,
  useCreateTicket,
  useUpdateTicketStatus,
  useEscalateTicket,
  type TicketPriority,
} from '@/hooks/useTickets';

const statusConfig = {
  wip: { label: 'Work In Progress', variant: 'status-wip' as const },
  pending: { label: 'Pending', variant: 'status-pending' as const },
  resolved: { label: 'Resolved', variant: 'status-resolved' as const },
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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    project_id: '',
    priority: 'medium' as TicketPriority,
    assigned_to: '',
    due_date: '',
  });

  // React Query hooks
  const { data, isLoading } = useTicketsData();
  const createTicket = useCreateTicket();
  const updateStatus = useUpdateTicketStatus();
  const escalateTicket = useEscalateTicket();

  const tickets = data?.tickets || [];
  const projects = data?.projects || [];
  const users = data?.users || [];

  const handleCreateTicket = useCallback(async () => {
    if (!newTicket.title.trim() || !newTicket.project_id) {
      return;
    }

    createTicket.mutate({
      title: newTicket.title,
      description: newTicket.description || null,
      project_id: newTicket.project_id,
      priority: newTicket.priority,
      assigned_to: newTicket.assigned_to || null,
      due_date: newTicket.due_date || null,
      created_by: user?.id || '',
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setNewTicket({
          title: '',
          description: '',
          project_id: '',
          priority: 'medium',
          assigned_to: '',
          due_date: '',
        });
      }
    });
  }, [newTicket, user?.id, createTicket]);

  const handleMarkResolved = useCallback((ticketId: string) => {
    updateStatus.mutate({
      ticketId,
      status: 'resolved',
      resolved_at: new Date().toISOString(),
    });
  }, [updateStatus]);

  const handleCloseTicket = useCallback((ticketId: string) => {
    updateStatus.mutate({
      ticketId,
      status: 'closed',
      closed_at: new Date().toISOString(),
    });
  }, [updateStatus]);

  const handleEscalate = useCallback((ticketId: string) => {
    escalateTicket.mutate(ticketId);
  }, [escalateTicket]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchQuery, statusFilter]);

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary/50 rounded w-48" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-secondary/50 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

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
            {isAdmin 
              ? 'Manage and track all tickets across projects' 
              : 'View and update your assigned tickets'}
          </p>
        </div>
        
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero">
                <Plus className="h-4 w-4 mr-2" />
                New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Ticket</DialogTitle>
                <DialogDescription>
                  Create a ticket and assign it to a team member.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="project">Project *</Label>
                  <Select 
                    value={newTicket.project_id} 
                    onValueChange={(value) => setNewTicket({ ...newTicket, project_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input 
                    id="title" 
                    placeholder="Brief description of the issue"
                    value={newTicket.title}
                    onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Detailed description..."
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select 
                      value={newTicket.priority} 
                      onValueChange={(value: TicketPriority) => setNewTicket({ ...newTicket, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Assign To</Label>
                    <Select 
                      value={newTicket.assigned_to} 
                      onValueChange={(value) => setNewTicket({ ...newTicket, assigned_to: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.full_name || u.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input 
                    id="dueDate" 
                    type="date"
                    value={newTicket.due_date}
                    onChange={(e) => setNewTicket({ ...newTicket, due_date: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
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
          <Input
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="wip">Work In Progress</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.length > 0 ? (
          filteredTickets.map((ticket, index) => (
            <Card 
              key={ticket.id} 
              hover 
              codeRed={ticket.is_code_red}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Ticket Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono text-muted-foreground">
                        {ticket.id.slice(0, 8)}
                      </span>
                      {ticket.is_code_red && (
                        <Badge variant="code-red" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Code Red
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg truncate">{ticket.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                      {ticket.description || 'No description'}
                    </p>
                    {ticket.project && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Project: {ticket.project.name}
                      </p>
                    )}
                  </div>

                  {/* Meta Info */}
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
                    
                    {ticket.due_date && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(ticket.due_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                    
                    {/* Users can mark resolved if ticket is open */}
                    {!isAdmin && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                      <Button 
                        variant="success" 
                        size="sm"
                        onClick={() => handleMarkResolved(ticket.id)}
                        disabled={updateStatus.isPending}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Resolve
                      </Button>
                    )}
                    
                    {/* Users can close ticket if it's resolved */}
                    {!isAdmin && ticket.status === 'resolved' && (
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => handleCloseTicket(ticket.id)}
                        disabled={updateStatus.isPending}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Close
                      </Button>
                    )}
                    
                    {/* Users can also close open tickets directly */}
                    {!isAdmin && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCloseTicket(ticket.id)}
                        disabled={updateStatus.isPending}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Close
                      </Button>
                    )}
                    
                    {/* Escalate to Code Red */}
                    {!isAdmin && !ticket.is_code_red && ticket.status !== 'closed' && (
                      <Button 
                        variant="code-red" 
                        size="sm"
                        onClick={() => handleEscalate(ticket.id)}
                        disabled={escalateTicket.isPending}
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Escalate
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <TicketIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-lg mb-1">No tickets found</h3>
              <p className="text-muted-foreground text-sm">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : isAdmin 
                    ? 'Create a new ticket to get started'
                    : 'No tickets have been assigned to you yet'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Clock,
} from 'lucide-react';

type TicketStatus = 'wip' | 'pending' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  projectName: string;
  assignedTo: string;
  isCodeRed: boolean;
  dueDate: string;
  createdAt: string;
}

// Mock data
const mockTickets: Ticket[] = [
  {
    id: 'TKT-1001',
    title: 'Fix authentication redirect loop',
    description: 'Users are experiencing infinite redirect when logging in via OAuth',
    status: 'wip',
    priority: 'high',
    projectName: 'Bug Fixes',
    assignedTo: 'john@example.com',
    isCodeRed: true,
    dueDate: '2024-12-25',
    createdAt: '2024-12-20',
  },
  {
    id: 'TKT-1002',
    title: 'Implement dashboard analytics widget',
    description: 'Create a new widget showing weekly performance metrics',
    status: 'pending',
    priority: 'medium',
    projectName: 'Sprint 42',
    assignedTo: 'sarah@example.com',
    isCodeRed: false,
    dueDate: '2024-12-28',
    createdAt: '2024-12-18',
  },
  {
    id: 'TKT-1003',
    title: 'Update user profile validation',
    description: 'Add email format validation and phone number verification',
    status: 'resolved',
    priority: 'low',
    projectName: 'Sprint 42',
    assignedTo: 'mike@example.com',
    isCodeRed: false,
    dueDate: '2024-12-30',
    createdAt: '2024-12-15',
  },
  {
    id: 'TKT-1004',
    title: 'Database connection timeout issue',
    description: 'Production database connections timing out during peak hours',
    status: 'wip',
    priority: 'high',
    projectName: 'Bug Fixes',
    assignedTo: 'john@example.com',
    isCodeRed: true,
    dueDate: '2024-12-24',
    createdAt: '2024-12-21',
  },
];

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
  const { isAdmin } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredTickets = mockTickets.filter((ticket) => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
                  <Label htmlFor="project">Project</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sprint-42">Sprint 42</SelectItem>
                      <SelectItem value="bug-fixes">Bug Fixes</SelectItem>
                      <SelectItem value="qa-testing">QA Testing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" placeholder="Brief description of the issue" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Detailed description..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select>
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
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="john">John Doe</SelectItem>
                        <SelectItem value="sarah">Sarah Smith</SelectItem>
                        <SelectItem value="mike">Mike Johnson</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input id="dueDate" type="date" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsDialogOpen(false)}>
                  Create Ticket
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
        {filteredTickets.map((ticket, index) => (
          <Card 
            key={ticket.id} 
            hover 
            codeRed={ticket.isCodeRed}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Ticket Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-mono text-muted-foreground">{ticket.id}</span>
                    {ticket.isCodeRed && (
                      <Badge variant="code-red" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Code Red
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg truncate">{ticket.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                    {ticket.description}
                  </p>
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <Badge variant={priorityConfig[ticket.priority].variant}>
                    {priorityConfig[ticket.priority].label}
                  </Badge>
                  <Badge variant={statusConfig[ticket.status].variant}>
                    {statusConfig[ticket.status].label}
                  </Badge>
                  
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{ticket.assignedTo.split('@')[0]}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(ticket.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                  {!isAdmin && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                    <Button variant="success" size="sm">
                      Mark Resolved
                    </Button>
                  )}
                  {!isAdmin && !ticket.isCodeRed && (
                    <Button variant="code-red" size="sm">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Escalate
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredTickets.length === 0 && (
          <Card className="py-12">
            <CardContent className="text-center">
              <TicketIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'No tickets have been created yet'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

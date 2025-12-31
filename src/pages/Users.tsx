import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users as UsersIcon, 
  Mail,
  Ticket,
  CheckCircle2,
  Clock,
  Shield,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'user';
  ticketsAssigned: number;
  ticketsResolved: number;
  avgResolutionTime: string;
  createdAt: string;
}

// Mock data
const mockUsers: UserProfile[] = [
  {
    id: '1',
    email: 'john@example.com',
    fullName: 'John Doe',
    role: 'user',
    ticketsAssigned: 8,
    ticketsResolved: 5,
    avgResolutionTime: '2.3 days',
    createdAt: '2024-11-15',
  },
  {
    id: '2',
    email: 'sarah@example.com',
    fullName: 'Sarah Smith',
    role: 'user',
    ticketsAssigned: 6,
    ticketsResolved: 4,
    avgResolutionTime: '1.8 days',
    createdAt: '2024-11-20',
  },
  {
    id: '3',
    email: 'mike@example.com',
    fullName: 'Mike Johnson',
    role: 'user',
    ticketsAssigned: 4,
    ticketsResolved: 3,
    avgResolutionTime: '3.1 days',
    createdAt: '2024-12-01',
  },
  {
    id: '4',
    email: 'admin@example.com',
    fullName: 'Admin User',
    role: 'admin',
    ticketsAssigned: 0,
    ticketsResolved: 0,
    avgResolutionTime: 'N/A',
    createdAt: '2024-10-01',
  },
];

export default function Users() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="p-6 lg:p-8">
        <Card className="py-12">
          <CardContent className="text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">
              Only administrators can view the user management panel.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <UsersIcon className="h-8 w-8 text-primary" />
          Team Members
        </h1>
        <p className="text-muted-foreground mt-1">
          View user profiles, workload, and performance metrics
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <UsersIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockUsers.length}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-warning/20 flex items-center justify-center">
              <Ticket className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {mockUsers.reduce((sum, u) => sum + u.ticketsAssigned, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Tickets Assigned</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {mockUsers.reduce((sum, u) => sum + u.ticketsResolved, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Tickets Resolved</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {mockUsers.map((user, index) => (
          <Card 
            key={user.id} 
            hover
            className="animate-fade-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* User Info */}
                <div className="flex items-center gap-4 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/20 text-primary text-lg">
                      {user.fullName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{user.fullName}</h3>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-warning">{user.ticketsAssigned}</p>
                    <p className="text-xs text-muted-foreground">Assigned</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-success">{user.ticketsResolved}</p>
                    <p className="text-xs text-muted-foreground">Resolved</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{user.avgResolutionTime}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Avg. Time</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    View Tickets
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Profile</DropdownMenuItem>
                      <DropdownMenuItem>Assign Ticket</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {user.role !== 'admin' && (
                        <DropdownMenuItem>Promote to Admin</DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

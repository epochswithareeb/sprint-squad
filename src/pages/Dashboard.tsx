import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Ticket, 
  FolderKanban, 
  AlertTriangle, 
  Clock, 
  CheckCircle2,
  ArrowRight,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();

  // Mock data - will be replaced with real data from Supabase
  const stats = {
    totalTickets: 24,
    openTickets: 12,
    resolvedTickets: 8,
    overdueTickets: 4,
    codeRedCount: 2,
    projectCount: 5,
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
        </h1>
        <p className="text-muted-foreground">
          {isAdmin 
            ? "Here's an overview of your team's ticketing activity." 
            : "Here's an overview of your assigned tickets."}
        </p>
      </div>

      {/* Code Red Alert */}
      {stats.codeRedCount > 0 && (
        <Card codeRed className="animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-code-red/20 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-code-red" />
                </div>
                <div>
                  <p className="font-semibold text-code-red">Code Red Active</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.codeRedCount} critical {stats.codeRedCount === 1 ? 'ticket needs' : 'tickets need'} immediate attention
                  </p>
                </div>
              </div>
              <Link to="/dashboard/code-red">
                <Button variant="code-red" size="sm">
                  View Now
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hover className="animate-fade-in stagger-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tickets
            </CardTitle>
            <Ticket className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all projects
            </p>
          </CardContent>
        </Card>

        <Card hover className="animate-fade-in stagger-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Tickets
            </CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.openTickets}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="status-wip">WIP</Badge>
              <Badge variant="status-pending">Pending</Badge>
            </div>
          </CardContent>
        </Card>

        <Card hover className="animate-fade-in stagger-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resolved
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.resolvedTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting admin closure
            </p>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card hover className="animate-fade-in stagger-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Projects
              </CardTitle>
              <FolderKanban className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.projectCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active projects
              </p>
            </CardContent>
          </Card>
        )}

        {!isAdmin && (
          <Card hover className="animate-fade-in stagger-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overdue
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{stats.overdueTickets}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Past due date
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Ticket className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Ticket #{1000 + i} updated</p>
                    <p className="text-xs text-muted-foreground">
                      Status changed to <Badge variant="status-pending" className="ml-1">Pending</Badge>
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">2h ago</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isAdmin && (
              <>
                <Link to="/dashboard/projects" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <FolderKanban className="h-4 w-4 mr-2" />
                    Create New Project
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                </Link>
                <Link to="/dashboard/tickets" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Ticket className="h-4 w-4 mr-2" />
                    Create New Ticket
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                </Link>
                <Link to="/dashboard/users" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <AlertTriangle className="h-4 w-4 mr-2 text-warning" />
                    View Pending Approvals
                    <Badge variant="warning" className="ml-auto">{stats.resolvedTickets}</Badge>
                  </Button>
                </Link>
              </>
            )}
            {!isAdmin && (
              <>
                <Link to="/dashboard/tickets" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Ticket className="h-4 w-4 mr-2" />
                    View My Tickets
                    <Badge variant="secondary" className="ml-auto">{stats.openTickets}</Badge>
                  </Button>
                </Link>
                <Link to="/dashboard/analytics" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Zap className="h-4 w-4 mr-2" />
                    View My Performance
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

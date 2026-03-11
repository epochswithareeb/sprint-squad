import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Ticket, FolderKanban, AlertTriangle, Clock, CheckCircle2,
  ArrowRight, Zap, Users, FileText, CalendarDays,
} from 'lucide-react';
import { Link } from 'react-router-dom';

async function fetchDashboardData() {
  const [ticketsRes, projectsRes, activityRes, leavesRes, profilesRes] = await Promise.all([
    supabase.from('tickets').select('*'),
    supabase.from('projects').select('id'),
    supabase.from('ticket_activity').select('id, action, ticket_id, created_at')
      .order('created_at', { ascending: false }).limit(5),
    supabase.from('leaves').select('*').eq('status', 'pending'),
    supabase.from('profiles').select('id, email, full_name'),
  ]);
  return {
    tickets: ticketsRes.data || [],
    projects: projectsRes.data || [],
    activity: activityRes.data || [],
    pendingLeaves: leavesRes.data || [],
    profiles: profilesRes.data || [],
  };
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
    staleTime: 20000,
    enabled: !!user,
  });

  const stats = useMemo(() => {
    if (!data) return null;
    const now = new Date();
    const t = data.tickets;
    return {
      total: t.length,
      open: t.filter(x => x.status === 'wip' || x.status === 'assigned').length,
      closed: t.filter(x => x.status === 'closed').length,
      overdue: t.filter(x => x.due_date && new Date(x.due_date) < now && x.status !== 'closed').length,
      codeRed: t.filter(x => x.is_code_red && x.status !== 'closed').length,
      projects: data.projects.length,
      pendingLeaves: data.pendingLeaves.length,
    };
  }, [data]);

  if (isLoading || !stats) {
    return (
      <div className="p-6 lg:p-8 space-y-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary/50 rounded w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-secondary/50 rounded-lg" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">
          Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : user?.email ? `, ${user.email.split('@')[0]}` : ''}
        </h1>
        <p className="text-muted-foreground">
          {isAdmin ? "Here's an overview of your team's activity." : "Here's an overview of your assigned tickets."}
        </p>
      </div>

      {/* Code Red Alert */}
      {stats.codeRed > 0 && (
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
                    {stats.codeRed} critical {stats.codeRed === 1 ? 'ticket needs' : 'tickets need'} immediate attention
                  </p>
                </div>
              </div>
              <Link to="/dashboard/code-red">
                <Button variant="code-red" size="sm">View Now <ArrowRight className="h-4 w-4 ml-1" /></Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Leaves Alert for Admin */}
      {isAdmin && stats.pendingLeaves > 0 && (
        <Card className="border-warning/30 animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-warning/20 flex items-center justify-center">
                  <CalendarDays className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="font-semibold text-warning">Pending Leave Requests</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.pendingLeaves} leave {stats.pendingLeaves === 1 ? 'request' : 'requests'} awaiting approval
                  </p>
                </div>
              </div>
              <Link to="/dashboard/leaves">
                <Button variant="outline" size="sm">Review <ArrowRight className="h-4 w-4 ml-1" /></Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hover className="animate-fade-in stagger-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all projects</p>
          </CardContent>
        </Card>

        <Card hover className="animate-fade-in stagger-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Tickets</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.open}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="status-wip">WIP</Badge>
              <Badge variant="status-pending">Assigned</Badge>
            </div>
          </CardContent>
        </Card>

        <Card hover className="animate-fade-in stagger-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Closed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.closed}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed tickets</p>
          </CardContent>
        </Card>

        {isAdmin ? (
          <Card hover className="animate-fade-in stagger-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Projects</CardTitle>
              <FolderKanban className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.projects}</div>
              <p className="text-xs text-muted-foreground mt-1">Active projects</p>
            </CardContent>
          </Card>
        ) : (
          <Card hover className="animate-fade-in stagger-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{stats.overdue}</div>
              <p className="text-xs text-muted-foreground mt-1">Past due date</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data!.activity.length > 0 ? (
              <div className="space-y-3">
                {data!.activity.map(a => (
                  <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Ticket className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{a.action}</p>
                      <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">No recent activity</p>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isAdmin ? (
              <>
                <Link to="/dashboard/projects" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <FolderKanban className="h-4 w-4 mr-2" /> Manage Projects <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                </Link>
                <Link to="/dashboard/tickets" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Ticket className="h-4 w-4 mr-2" /> Manage Tickets <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                </Link>
                <Link to="/dashboard/reports" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" /> View Weekly Report <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                </Link>
                <Link to="/dashboard/leaves" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarDays className="h-4 w-4 mr-2" /> Leave Requests
                    {stats.pendingLeaves > 0 && <Badge variant="warning" className="ml-auto">{stats.pendingLeaves}</Badge>}
                    {stats.pendingLeaves === 0 && <ArrowRight className="h-4 w-4 ml-auto" />}
                  </Button>
                </Link>
                <Link to="/dashboard/users" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" /> Team Members <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/dashboard/tickets" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Ticket className="h-4 w-4 mr-2" /> View My Tickets
                    <Badge variant="secondary" className="ml-auto">{stats.open}</Badge>
                  </Button>
                </Link>
                <Link to="/dashboard/leaves" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarDays className="h-4 w-4 mr-2" /> My Leaves <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                </Link>
                <Link to="/dashboard/analytics" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Zap className="h-4 w-4 mr-2" /> View My Performance <ArrowRight className="h-4 w-4 ml-auto" />
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

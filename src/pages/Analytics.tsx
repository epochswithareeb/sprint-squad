import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3, 
  TrendingUp,
  Ticket,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Target,
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface AnalyticsData {
  totalTickets: number;
  resolvedTickets: number;
  codeRedCount: number;
  statusDistribution: { name: string; value: number; color: string }[];
  userPerformance: { name: string; resolved: number }[];
}

export default function Analytics() {
  const { isAdmin, user } = useAuth();
  const [data, setData] = useState<AnalyticsData>({
    totalTickets: 0,
    resolvedTickets: 0,
    codeRedCount: 0,
    statusDistribution: [],
    userPerformance: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch tickets
        const { data: tickets, error: ticketsError } = await supabase
          .from('tickets')
          .select('*');

        if (ticketsError) throw ticketsError;

        // Fetch profiles for user performance
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, full_name');

        if (profilesError) throw profilesError;

        const ticketsList = tickets || [];

        // Calculate status distribution
        const statusCounts = {
          assigned: ticketsList.filter(t => t.status === 'assigned').length,
          wip: ticketsList.filter(t => t.status === 'wip').length,
          closed: ticketsList.filter(t => t.status === 'closed').length,
        };

        const statusDistribution = [
          { name: 'Assigned', value: statusCounts.assigned, color: 'hsl(var(--warning))' },
          { name: 'WIP', value: statusCounts.wip, color: 'hsl(var(--primary))' },
          { name: 'Closed', value: statusCounts.closed, color: 'hsl(var(--muted-foreground))' },
        ].filter(s => s.value > 0);

        // Calculate user performance
        const userPerformance = (profiles || [])
          .map(profile => {
            const userTickets = ticketsList.filter(t => t.assigned_to === profile.id);
            const resolved = userTickets.filter(t => t.status === 'closed').length;
            return {
              name: profile.full_name || profile.email.split('@')[0],
              resolved,
            };
          })
          .filter(u => u.resolved > 0)
          .sort((a, b) => b.resolved - a.resolved)
          .slice(0, 5);

        setData({
          totalTickets: ticketsList.length,
          resolvedTickets: ticketsList.filter(t => t.status === 'resolved' || t.status === 'closed').length,
          codeRedCount: ticketsList.filter(t => t.is_code_red && t.status !== 'closed').length,
          statusDistribution,
          userPerformance,
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary/50 rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-secondary/50 rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-secondary/50 rounded-lg" />
            <div className="h-80 bg-secondary/50 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  const resolutionRate = data.totalTickets > 0 
    ? Math.round((data.resolvedTickets / data.totalTickets) * 100) 
    : 0;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          {isAdmin ? 'Team Analytics' : 'My Analytics'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAdmin 
            ? 'Platform-wide metrics and team performance' 
            : 'Your personal performance and workload overview'}
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="animate-fade-in stagger-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tickets</p>
                <p className="text-3xl font-bold">{data.totalTickets}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <Ticket className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in stagger-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-3xl font-bold">{data.resolvedTickets}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {resolutionRate}% resolution rate
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-success/20 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in stagger-3">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Tickets</p>
                <p className="text-3xl font-bold">{data.totalTickets - data.resolvedTickets}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-warning/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in stagger-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Code Red</p>
                <p className="text-3xl font-bold">{data.codeRedCount}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Active escalations
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-code-red/20 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-code-red" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg">Ticket Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {data.statusDistribution.length > 0 ? (
              <>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {data.statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {data.statusDistribution.map((status) => (
                    <div key={status.name} className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: status.color }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {status.name} ({status.value})
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No ticket data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Performance (Admin Only) */}
        {isAdmin && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Team Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.userPerformance.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.userPerformance} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        width={80}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar 
                        dataKey="resolved" 
                        fill="hsl(var(--primary))" 
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No performance data available
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!isAdmin && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Your Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">
                Performance tracking coming soon
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

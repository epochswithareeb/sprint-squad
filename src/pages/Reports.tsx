import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText, CheckCircle2, Clock, AlertTriangle, TrendingUp, Shield,
} from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

async function fetchReportData() {
  const [ticketsRes, profilesRes, leavesRes] = await Promise.all([
    supabase.from('tickets').select('*'),
    supabase.from('profiles').select('id, email, full_name'),
    supabase.from('leaves').select('*').eq('status', 'approved'),
  ]);
  if (ticketsRes.error) throw ticketsRes.error;
  if (profilesRes.error) throw profilesRes.error;
  if (leavesRes.error) throw leavesRes.error;
  return {
    tickets: ticketsRes.data || [],
    profiles: profilesRes.data || [],
    leaves: leavesRes.data || [],
  };
}

export default function Reports() {
  const { isAdmin } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['report-data'],
    queryFn: fetchReportData,
    staleTime: 30000,
  });

  const weekReport = useMemo(() => {
    if (!data) return [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      const dayStr = day.toISOString().split('T')[0];
      const isToday = day.toDateString() === today.toDateString();
      const isPast = day < today && !isToday;

      // Tickets created on this day
      const created = data.tickets.filter(t => t.created_at.startsWith(dayStr));
      // Tickets resolved on this day
      const resolved = data.tickets.filter(t => t.closed_at && t.closed_at.startsWith(dayStr));
      // Tickets closed on this day
      const closed = data.tickets.filter(t => t.closed_at && t.closed_at.startsWith(dayStr));
      // Leaves on this day
      const onLeave = data.leaves.filter(l => l.leave_date === dayStr);
      const leaveUsers = onLeave.map(l => {
        const p = data.profiles.find(p => p.id === l.user_id);
        return p?.full_name || p?.email?.split('@')[0] || 'Unknown';
      });

      return {
        day: DAYS[day.getDay()],
        date: dayStr,
        isToday,
        isPast,
        created: created.length,
        resolved: resolved.length,
        closed: closed.length,
        leaveUsers,
      };
    });
  }, [data]);

  const userSummary = useMemo(() => {
    if (!data) return [];
    return data.profiles.map(p => {
      const userTickets = data.tickets.filter(t => t.assigned_to === p.id);
      return {
        name: p.full_name || p.email.split('@')[0],
        email: p.email,
        total: userTickets.length,
        wip: userTickets.filter(t => t.status === 'wip').length,
        assigned: userTickets.filter(t => t.status === 'assigned').length,
        closed: userTickets.filter(t => t.status === 'closed').length,
        codeRed: userTickets.filter(t => t.is_code_red && t.status !== 'closed').length,
      };
    }).filter(u => u.total > 0).sort((a, b) => b.total - a.total);
  }, [data]);

  if (!isAdmin) {
    return (
      <div className="p-6 lg:p-8">
        <Card className="py-12">
          <CardContent className="text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">Only administrators can view reports.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary/50 rounded w-48" />
          <div className="grid grid-cols-7 gap-3">
            {[1,2,3,4,5,6,7].map(i => <div key={i} className="h-40 bg-secondary/50 rounded-lg" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          Weekly Report
        </h1>
        <p className="text-muted-foreground mt-1">
          Daily progress and status report across all users
        </p>
      </div>

      {/* Weekly Calendar View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {weekReport.map(day => (
          <Card key={day.date} className={`transition-all ${day.isToday ? 'border-primary/50 glow-primary' : ''} ${!day.isPast && !day.isToday ? 'opacity-60' : ''}`}>
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>{day.day}</span>
                {day.isToday && <Badge variant="default" className="text-[10px] px-1.5 py-0">Today</Badge>}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2">
              <div className="flex items-center gap-1.5 text-xs">
                <TrendingUp className="h-3 w-3 text-primary" />
                <span>{day.created} created</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="h-3 w-3 text-success" />
                <span>{day.resolved} resolved</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span>{day.closed} closed</span>
              </div>
              {day.leaveUsers.length > 0 && (
                <div className="pt-1 border-t border-border">
                  <p className="text-[10px] text-warning font-medium mb-0.5">On Leave:</p>
                  {day.leaveUsers.map((u, i) => (
                    <p key={i} className="text-[10px] text-muted-foreground">{u}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User-wise Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">User Status Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">User</th>
                  <th className="text-center py-3 px-2 text-muted-foreground font-medium">Total</th>
                   <th className="text-center py-3 px-2 text-muted-foreground font-medium">Assigned</th>
                   <th className="text-center py-3 px-2 text-muted-foreground font-medium">WIP</th>
                   <th className="text-center py-3 px-2 text-muted-foreground font-medium">Closed</th>
                  <th className="text-center py-3 px-2 text-muted-foreground font-medium">Code Red</th>
                </tr>
              </thead>
              <tbody>
                {userSummary.map(u => (
                  <tr key={u.email} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-2">
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="text-center py-3 px-2 font-bold">{u.total}</td>
                    <td className="text-center py-3 px-2">
                      <Badge variant="status-wip">{u.wip}</Badge>
                    </td>
                    <td className="text-center py-3 px-2">
                      <Badge variant="status-pending">{u.pending}</Badge>
                    </td>
                    <td className="text-center py-3 px-2">
                      <Badge variant="status-resolved">{u.resolved}</Badge>
                    </td>
                    <td className="text-center py-3 px-2">
                      <Badge variant="secondary">{u.closed}</Badge>
                    </td>
                    <td className="text-center py-3 px-2">
                      {u.codeRed > 0 ? (
                        <Badge variant="code-red">{u.codeRed}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                  </tr>
                ))}
                {userSummary.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      No ticket data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

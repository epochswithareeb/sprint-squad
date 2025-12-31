import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Clock, 
  User,
  Calendar,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface CodeRedTicket {
  id: string;
  title: string;
  description: string;
  projectName: string;
  assignedTo: string;
  dueDate: string;
  createdAt: string;
  escalatedAt: string;
}

// Mock data
const codeRedTickets: CodeRedTicket[] = [
  {
    id: 'TKT-1001',
    title: 'Fix authentication redirect loop',
    description: 'Users are experiencing infinite redirect when logging in via OAuth. Production system affected.',
    projectName: 'Bug Fixes',
    assignedTo: 'john@example.com',
    dueDate: '2024-12-25',
    createdAt: '2024-12-20',
    escalatedAt: '2024-12-21T14:30:00Z',
  },
  {
    id: 'TKT-1004',
    title: 'Database connection timeout issue',
    description: 'Production database connections timing out during peak hours. Revenue impact suspected.',
    projectName: 'Bug Fixes',
    assignedTo: 'john@example.com',
    dueDate: '2024-12-24',
    createdAt: '2024-12-21',
    escalatedAt: '2024-12-22T09:15:00Z',
  },
];

export default function CodeRed() {
  const { isAdmin } = useAuth();

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-code-red/20 flex items-center justify-center glow-code-red">
            <AlertTriangle className="h-7 w-7 text-code-red" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-code-red">Code Red</h1>
            <p className="text-muted-foreground">
              Critical tickets requiring immediate attention
            </p>
          </div>
        </div>

        {codeRedTickets.length > 0 && (
          <Card codeRed className="animate-fade-in">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-code-red animate-pulse" />
                <span className="font-semibold text-code-red">
                  {codeRedTickets.length} critical {codeRedTickets.length === 1 ? 'issue' : 'issues'} active
                </span>
                <span className="text-muted-foreground">—</span>
                <span className="text-sm text-muted-foreground">
                  Immediate action required
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Code Red Tickets */}
      <div className="space-y-4">
        {codeRedTickets.map((ticket, index) => (
          <Card 
            key={ticket.id} 
            codeRed
            className="animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="code-red" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Code Red
                  </Badge>
                  <span className="text-sm font-mono text-muted-foreground">{ticket.id}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Escalated {getTimeAgo(ticket.escalatedAt)}</span>
                </div>
              </div>
              <CardTitle className="text-xl mt-2">{ticket.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{ticket.description}</p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Project:</span>
                  <Badge variant="outline">{ticket.projectName}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{ticket.assignedTo.split('@')[0]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Due: {new Date(ticket.dueDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1">
                  View Details
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                {isAdmin && (
                  <>
                    <Button variant="success">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Resolve & Close
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {codeRedTickets.length === 0 && (
          <Card className="py-16">
            <CardContent className="text-center">
              <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-2">All Clear</h3>
              <p className="text-muted-foreground">
                No critical tickets requiring immediate attention
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

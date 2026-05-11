import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveSprint } from '@/hooks/useSprint';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard, FolderKanban, Ticket, Users, BarChart3,
  AlertTriangle, LogOut, Zap, CalendarDays, FileText, Rocket,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const adminNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Projects', url: '/dashboard/projects', icon: FolderKanban },
  { title: 'Tickets', url: '/dashboard/tickets', icon: Ticket },
  { title: 'Code Red', url: '/dashboard/code-red', icon: AlertTriangle },
  { title: 'Reports', url: '/dashboard/reports', icon: FileText },
  { title: 'Leaves', url: '/dashboard/leaves', icon: CalendarDays },
  { title: 'Users', url: '/dashboard/users', icon: Users },
  { title: 'Analytics', url: '/dashboard/analytics', icon: BarChart3 },
];

const userNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'My Tickets', url: '/dashboard/tickets', icon: Ticket },
  { title: 'My Leaves', url: '/dashboard/leaves', icon: CalendarDays },
  { title: 'Analytics', url: '/dashboard/analytics', icon: BarChart3 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const { data: activeSprint } = useActiveSprint();

  const navItems = isAdmin ? adminNavItems : userNavItems;

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <Sidebar className={cn(collapsed ? 'w-14' : 'w-60', 'transition-all duration-200')}>
      <div className={cn('p-4 border-b border-sidebar-border', collapsed && 'px-2')}>
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          {!collapsed && <span className="font-bold text-lg gradient-text">ITS</span>}
        </Link>
      </div>

      <SidebarContent className="px-2 py-4">
        {activeSprint && (
          <div className={cn('px-2 mb-3', collapsed && 'px-0')}>
            <Link
              to="/dashboard/sprint"
              className={cn(
                'flex items-center gap-2 rounded-lg font-bold text-white transition-all',
                'animate-pulse-glow',
                collapsed ? 'justify-center px-2 py-2' : 'px-3 py-2.5'
              )}
              style={{
                background: 'hsl(var(--sprint))',
                boxShadow: '0 0 24px hsl(var(--sprint) / 0.6)',
              }}
              title="Sprint is LIVE"
            >
              <Rocket className="h-5 w-5 flex-shrink-0" />
              {!collapsed && (
                <div className="flex flex-col leading-tight">
                  <span className="text-sm">SPRINT LIVE</span>
                  <span className="text-[10px] font-normal opacity-90 truncate">{activeSprint.name}</span>
                </div>
              )}
            </Link>
          </div>
        )}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider mb-2">
              {isAdmin ? 'Admin' : 'Navigation'}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200',
                        isActive(item.url)
                          ? 'bg-primary/20 text-primary border border-primary/30'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )}>
                      <item.icon className={cn('h-5 w-5 flex-shrink-0',
                        item.title === 'Code Red' && 'text-code-red'
                      )} />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/20 text-primary text-sm">
              {user?.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{isAdmin ? 'Admin' : 'User'}</p>
            </div>
          )}
        </div>
        <Button variant="ghost" size={collapsed ? 'icon' : 'sm'}
          onClick={handleSignOut}
          className={cn('mt-2 text-muted-foreground hover:text-foreground',
            collapsed ? 'w-full' : 'w-full justify-start')}>
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

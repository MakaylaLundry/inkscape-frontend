import { ReactNode } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Image,
  Tag,
  FileText,
  ScanLine,
  History,
  User,
  LogOut,
  Menu,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AccessibilitySettings } from '@/components/AccessibilitySettings';
import { BackendStatus } from '@/components/BackendStatus';
import { AuthStatus } from '@/components/AuthStatus';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

const artistNavItems = [
  { label: 'My Artworks', path: '/artist/artworks', icon: Image },
  { label: 'Create Tag', path: '/artist/create', icon: Tag },
  { label: 'Compliance Logs', path: '/artist/compliance', icon: FileText },
];

const companyNavItems = [
  { label: 'Scan Dataset', path: '/company/scan', icon: ScanLine },
  { label: 'Scan History', path: '/company/history', icon: History },
  { label: 'Profile', path: '/company/profile', icon: User },
];

function NavItems({ items, currentPath }: { items: typeof artistNavItems; currentPath: string }) {
  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const isActive = currentPath === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-sm',
              'text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Infer role from URL path as fallback when state is not available
  const inferredRole = location.pathname.startsWith('/artist') 
    ? 'artist' 
    : location.pathname.startsWith('/company') 
      ? 'company' 
      : null;

  const effectiveRole = role || inferredRole;
  const navItems = effectiveRole === 'artist' ? artistNavItems : companyNavItems;
  const dashboardTitle = effectiveRole === 'artist' ? 'Artist Dashboard' : 'Company Dashboard';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo - Editorial masthead */}
      <div className="p-6 border-b border-border">
        <Link to="/" className="block">
          <Logo size="md" />
        </Link>
        <p className="ink-section-title mt-3 mb-0">{dashboardTitle}</p>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4">
        <NavItems items={navItems} currentPath={location.pathname} />
      </div>

      {/* User section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40">
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SidebarContent />
            </SheetContent>
          </Sheet>

          <div className="hidden lg:block" />

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <BackendStatus showUrl />
            <AuthStatus showRole />
            <AccessibilitySettings />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="max-w-6xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

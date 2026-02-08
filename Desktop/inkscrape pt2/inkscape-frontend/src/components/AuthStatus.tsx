import { User, LogIn, Shield, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface AuthStatusProps {
  className?: string;
  showRole?: boolean;
}

export function AuthStatus({ className, showRole = true }: AuthStatusProps) {
  const { isAuthenticated, isLoading, isRoleLoading, role, user } = useAuth();

  if (isLoading) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-medium',
          'bg-muted text-muted-foreground',
          className
        )}
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Checking auth...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-medium',
          'bg-muted text-muted-foreground',
          className
        )}
      >
        <LogIn className="h-3 w-3" />
        <span>Logged out</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-medium',
        'bg-status-allowed/10 text-status-allowed',
        className
      )}
    >
      <User className="h-3 w-3" />
      <span>Logged in</span>
      {showRole && (
        <>
          {isRoleLoading ? (
            <Loader2 className="h-3 w-3 animate-spin ml-1" />
          ) : role ? (
            <span className="flex items-center gap-1 ml-1 text-muted-foreground">
              <Shield className="h-3 w-3" />
              {role}
            </span>
          ) : null}
        </>
      )}
    </div>
  );
}

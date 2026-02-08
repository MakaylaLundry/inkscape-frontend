import { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/apiClient';
import { API_BASE_URL } from '@/lib/apiConfig';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BackendStatusProps {
  className?: string;
  showUrl?: boolean;
}

type ConnectionStatus = 'checking' | 'connected' | 'disconnected';

export function BackendStatus({ className, showUrl = false }: BackendStatusProps) {
  const [status, setStatus] = useState<ConnectionStatus>('checking');
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkHealth = useCallback(async () => {
    try {
      const response = await apiClient.checkHealth();
      if (response.ok) {
        setStatus('connected');
        setLastError(null);
      } else {
        setStatus('disconnected');
        setLastError('Health check returned ok: false');
      }
    } catch (error) {
      setStatus('disconnected');
      
      if (error instanceof ApiError) {
        if (error.status === 0) {
          setLastError(error.message); // Network/CORS error
        } else if (error.status === 401) {
          setLastError('401 Unauthorized');
        } else if (error.status === 403) {
          setLastError('403 Forbidden');
        } else {
          setLastError(`${error.status}: ${error.message}`);
        }
      } else {
        setLastError((error as Error).message || 'Unknown error');
      }
    } finally {
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    checkHealth();
    
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const statusContent = (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-medium cursor-default',
        status === 'connected' && 'bg-status-allowed/10 text-status-allowed',
        status === 'disconnected' && 'bg-status-restricted/10 text-status-restricted',
        status === 'checking' && 'bg-muted text-muted-foreground',
        className
      )}
    >
      {status === 'checking' && (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Checking...</span>
        </>
      )}
      {status === 'connected' && (
        <>
          <Wifi className="h-3 w-3" />
          <span>Backend Connected</span>
        </>
      )}
      {status === 'disconnected' && (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Backend Offline</span>
        </>
      )}
    </div>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {statusContent}
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <div className="space-y-1 text-xs">
          {showUrl && (
            <p className="font-mono text-muted-foreground break-all">{API_BASE_URL}</p>
          )}
          <p>
            <span className="font-medium">Status:</span>{' '}
            {status === 'connected' ? 'Connected' : status === 'checking' ? 'Checking...' : 'Offline'}
          </p>
          {lastError && (
            <p className="flex items-start gap-1 text-status-restricted">
              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>{lastError}</span>
            </p>
          )}
          {lastChecked && (
            <p className="text-muted-foreground">
              Last check: {lastChecked.toLocaleTimeString()}
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

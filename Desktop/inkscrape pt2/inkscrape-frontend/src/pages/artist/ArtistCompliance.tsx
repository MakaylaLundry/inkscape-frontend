import { useState, useEffect } from 'react';
import { FileText, Loader2, AlertCircle, Eye } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { apiClient, ApiError } from '@/lib/apiClient';
import type { ComplianceEvent } from '@/lib/apiTypes';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function ArtistCompliance() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<ComplianceEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getComplianceEvents();
      setLogs(data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not load compliance logs.';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getOutcomeStatus = (outcome: string): 'allowed' | 'restricted' | 'conditional' => {
    switch (outcome) {
      case 'allowed':
        return 'allowed';
      case 'removed':
        return 'restricted';
      case 'agreement_accepted':
        return 'conditional';
      default:
        return 'conditional';
    }
  };

  const getOutcomeLabel = (outcome: string): string => {
    switch (outcome) {
      case 'allowed':
        return 'Allowed';
      case 'removed':
        return 'Removed';
      case 'agreement_accepted':
        return 'Agreement Accepted';
      default:
        return outcome;
    }
  };

  // Separate similarity events from regular compliance events
  const regularEvents = logs.filter(log => log.eventType !== 'similarity');
  const similarityEvents = logs.filter(log => log.eventType === 'similarity');

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <p className="ink-section-title">Activity</p>
        <h1 className="font-serif text-2xl font-semibold mb-1">Compliance Logs</h1>
        <p className="text-muted-foreground">
          Track how companies are using your artwork
        </p>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 p-4 rounded-sm bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={loadLogs} className="ml-auto">
            Retry
          </Button>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : logs.length === 0 && !error ? (
        <div className="ink-card text-center py-16">
          <div className="p-4 rounded-sm bg-accent inline-block mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="font-serif text-xl font-semibold mb-2">No compliance logs yet</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            When companies scan datasets containing your tagged artwork, you'll see the activity here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Regular Compliance Events */}
          {regularEvents.length > 0 && (
            <div>
              <h2 className="font-serif text-lg font-semibold mb-4">Compliance Events</h2>
              <div className="ink-card overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Company
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Artwork
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Use Case
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Date
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Outcome
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {regularEvents.map((log) => (
                        <tr key={log.id} className="hover:bg-accent/30 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-medium">{log.company_name}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {log.artwork_name}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 text-xs font-medium rounded-sm bg-accent">
                              {log.use_case}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {new Date(log.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={getOutcomeStatus(log.outcome)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Similarity Events */}
          {similarityEvents.length > 0 && (
            <div>
              <h2 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
                <Eye className="h-5 w-5 text-status-conditional" />
                Similarity Detections
              </h2>
              <div className="ink-card overflow-hidden p-0 border-2 border-status-conditional/30">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-status-conditional/5">
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Company
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Your Artwork
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Similarity
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Date
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {similarityEvents.map((log) => (
                        <tr key={log.id} className="hover:bg-accent/30 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-medium">{log.company_name}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {log.artwork_name}
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2.5 py-1 text-xs font-medium rounded-sm",
                              log.similarity_score && log.similarity_score > 0.8
                                ? "bg-status-restricted/10 text-status-restricted"
                                : "bg-status-conditional/10 text-status-conditional"
                            )}>
                              {log.similarity_score 
                                ? `${(log.similarity_score * 100).toFixed(0)}%`
                                : 'Detected'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {new Date(log.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={getOutcomeStatus(log.outcome)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

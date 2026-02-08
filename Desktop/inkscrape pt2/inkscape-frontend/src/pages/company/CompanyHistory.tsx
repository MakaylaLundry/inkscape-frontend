import { useState, useEffect } from 'react';
import { History, Loader2, ScanLine } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/apiClient';
import type { ScanResult } from '@/lib/apiTypes';
import { useToast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function CompanyHistory() {
  const { toast } = useToast();
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getScanHistory();
      setScans(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not load scan history.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <p className="ink-section-title">Archive</p>
          <h1 className="font-serif text-2xl font-semibold mb-1">Scan History</h1>
          <p className="text-muted-foreground">
            View past dataset scans and results
          </p>
        </div>
        <Link to="/company/scan">
          <Button className="gap-2">
            <ScanLine className="h-4 w-4" />
            New Scan
          </Button>
        </Link>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : scans.length === 0 ? (
        <div className="ink-card text-center py-16">
          <div className="p-4 rounded-sm bg-accent inline-block mb-4">
            <History className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="font-serif text-xl font-semibold mb-2">No scans yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Start by scanning a dataset to check for compliance with artist permissions.
          </p>
          <Link to="/company/scan">
            <Button className="gap-2">
              <ScanLine className="h-4 w-4" />
              Run your first scan
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <Accordion type="single" collapsible className="space-y-4">
            {scans.map((scan) => (
              <AccordionItem
                key={scan.scan_id}
                value={scan.scan_id}
                className="ink-card border-0"
              >
                <AccordionTrigger className="hover:no-underline px-6 py-4">
                  <div className="flex items-center gap-6 text-left flex-1">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        Scan #{scan.scan_id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(scan.scanned_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-status-allowed">{scan.safe_to_use} safe</span>
                      <span className="text-status-conditional">{scan.conditional} conditional</span>
                      <span className="text-status-restricted">{scan.restricted} restricted</span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <div className="border-t border-border pt-4">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          <th className="pb-2">Filename</th>
                          <th className="pb-2">Artist</th>
                          <th className="pb-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {scan.items.map((item, index) => (
                          <tr key={index} className="text-sm">
                            <td className="py-2">{item.file_name}</td>
                            <td className="py-2 text-muted-foreground">{item.artist_name}</td>
                            <td className="py-2">
                              <StatusBadge status={item.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </DashboardLayout>
  );
}

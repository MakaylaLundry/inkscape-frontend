import { useState } from 'react';
import { ScanLine, Loader2, FileCheck, AlertTriangle, XCircle, FileText, AlertCircle, FileWarning } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { FileDropzone } from '@/components/FileDropzone';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { apiClient, ApiError } from '@/lib/apiClient';
import type { ScanResponse, ScanReportItem, SimilarityFinding } from '@/lib/apiTypes';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ListenForHelp } from '@/components/ListenForHelp';

export default function CompanyScan() {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Agreement modal state
  const [selectedItem, setSelectedItem] = useState<ScanReportItem | null>(null);
  const [showAgreementModal, setShowAgreementModal] = useState(false);

  const handleScan = async () => {
    if (files.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please upload files to scan.',
        variant: 'destructive',
      });
      return;
    }

    setIsScanning(true);
    setScanResult(null);
    setError(null);

    // Separate zip files from regular files
    const zipFiles = files.filter(f => f.name.endsWith('.zip'));
    const regularFiles = files.filter(f => !f.name.endsWith('.zip'));

    try {
      const result = await apiClient.scanDataset(regularFiles, zipFiles[0]);
      setScanResult(result);
      toast({
        title: 'Scan complete',
        description: `Scanned ${result.summary.totalFilesScanned} files: ${result.summary.allowed} allowed, ${result.summary.restricted} restricted, ${result.summary.conditional} conditional.`,
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not complete the scan. Please try again.';
      setError(message);
      toast({
        title: 'Scan failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleViewAgreement = (item: ScanReportItem) => {
    setSelectedItem(item);
    setShowAgreementModal(true);
  };

  const resetScan = () => {
    setFiles([]);
    setScanResult(null);
    setError(null);
  };

  const renderReportSection = (
    title: string,
    items: ScanReportItem[],
    status: 'allowed' | 'restricted' | 'conditional' | 'unmatched',
    icon: React.ReactNode
  ) => {
    if (items.length === 0) return null;

    return (
      <div className="ink-card overflow-hidden p-0 mb-4">
        <div className="p-4 border-b border-border flex items-center gap-2">
          {icon}
          <h3 className="font-serif font-semibold">{title}</h3>
          <span className="text-sm text-muted-foreground">({items.length})</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-accent/30">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Filename
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Artist
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                {status === 'conditional' && (
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item, idx) => (
                <tr key={`${item.file_name}-${idx}`} className="hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-sm">{item.file_name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{item.artist_name || 'Unknown'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={status === 'unmatched' ? 'conditional' : status} />
                  </td>
                  {status === 'conditional' && (
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => handleViewAgreement(item)}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        View Terms
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSimilaritySection = (
    title: string,
    findings: SimilarityFinding[],
    variant: 'danger' | 'warning'
  ) => {
    if (!findings || findings.length === 0) return null;

    return (
      <div className={cn(
        "ink-card overflow-hidden p-0 mb-4 border-2",
        variant === 'danger' ? 'border-status-restricted/50' : 'border-status-conditional/50'
      )}>
        <div className={cn(
          "p-4 border-b border-border flex items-center gap-2",
          variant === 'danger' ? 'bg-status-restricted/10' : 'bg-status-conditional/10'
        )}>
          <FileWarning className={cn(
            "h-5 w-5",
            variant === 'danger' ? 'text-status-restricted' : 'text-status-conditional'
          )} />
          <h3 className="font-serif font-semibold">{title}</h3>
          <span className="text-sm text-muted-foreground">({findings.length})</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-accent/30">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Filename
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Similar To
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Similarity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {findings.map((finding, idx) => (
                <tr key={`${finding.file_name}-${idx}`} className="hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-sm">{finding.file_name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{finding.artist_name || 'Protected Work'}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "px-2 py-1 text-xs font-medium rounded-sm",
                      variant === 'danger' ? 'bg-status-restricted/10 text-status-restricted' : 'bg-status-conditional/10 text-status-conditional'
                    )}>
                      {finding.similarity_score ? `${(finding.similarity_score * 100).toFixed(0)}%` : 'High'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <p className="ink-section-title">Compliance Check</p>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="font-serif text-2xl font-semibold">Scan Dataset</h1>
          <ListenForHelp
            title="How Scanning Works"
            explanation="This tool checks your dataset files against our database of artist permissions. Upload your images or a zip file, and we'll identify which files are safe to use, which require agreements, and which are restricted. Green means you can use it freely, yellow means you need to accept terms, and red means the artist has denied permission for AI training."
          />
        </div>
        <p className="text-muted-foreground">
          Upload files to check for compliance with artist permissions
        </p>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 p-4 rounded-sm bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Main content */}
      {!scanResult ? (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="ink-card">
            <h2 className="font-serif text-lg font-semibold mb-4">Upload Dataset</h2>
            <FileDropzone
              onFilesSelected={setFiles}
              accept="image/*,.zip"
              multiple
              maxFiles={50}
            />
          </div>

          {files.length > 0 && (
            <Button
              size="lg"
              className="w-full gap-2"
              onClick={handleScan}
              disabled={isScanning}
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Hashing & Scanning...
                </>
              ) : (
                <>
                  <ScanLine className="h-4 w-4" />
                  Scan {files.length} file{files.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="ink-card text-center">
              <p className="font-serif text-3xl font-semibold text-foreground">{scanResult.summary.totalFilesScanned}</p>
              <p className="text-sm text-muted-foreground">Total Scanned</p>
            </div>
            <div className="ink-card text-center">
              <p className="font-serif text-3xl font-semibold text-status-allowed">{scanResult.summary.allowed}</p>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <FileCheck className="h-4 w-4" /> Allowed
              </p>
            </div>
            <div className="ink-card text-center">
              <p className="font-serif text-3xl font-semibold text-status-conditional">{scanResult.summary.conditional}</p>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <AlertTriangle className="h-4 w-4" /> Conditional
              </p>
            </div>
            <div className="ink-card text-center">
              <p className="font-serif text-3xl font-semibold text-status-restricted">{scanResult.summary.restricted}</p>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <XCircle className="h-4 w-4" /> Restricted
              </p>
            </div>
          </div>

          {/* New Scan Button */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={resetScan}>
              New Scan
            </Button>
          </div>

          {/* Similarity Findings - rendered separately */}
          {scanResult.similarityFindings && (
            <div className="space-y-4">
              <h2 className="font-serif text-xl font-semibold">Similarity Findings</h2>
              {renderSimilaritySection(
                'Work at Risk',
                scanResult.similarityFindings.work_at_risk,
                'danger'
              )}
              {renderSimilaritySection(
                'May Be at Risk',
                scanResult.similarityFindings.may_be_at_risk,
                'warning'
              )}
            </div>
          )}

          {/* Report Groups */}
          <div className="space-y-4">
            <h2 className="font-serif text-xl font-semibold">Scan Report</h2>
            
            {renderReportSection(
              'Allowed Files',
              scanResult.report.allowed,
              'allowed',
              <FileCheck className="h-5 w-5 text-status-allowed" />
            )}
            
            {renderReportSection(
              'Conditional Files',
              scanResult.report.conditional,
              'conditional',
              <AlertTriangle className="h-5 w-5 text-status-conditional" />
            )}
            
            {renderReportSection(
              'Restricted Files',
              scanResult.report.restricted,
              'restricted',
              <XCircle className="h-5 w-5 text-status-restricted" />
            )}
            
            {renderReportSection(
              'Unmatched Files',
              scanResult.report.unmatched,
              'unmatched',
              <FileText className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
      )}

      {/* Agreement Modal */}
      <Dialog open={showAgreementModal} onOpenChange={setShowAgreementModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-serif">Usage Terms</DialogTitle>
            <DialogDescription>
              Terms for using {selectedItem?.file_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-4 bg-accent/30 rounded-sm">
            {selectedItem?.permissions ? (
              <div className="space-y-4">
                <div>
                  <p className="font-medium mb-1">AI Training Permission</p>
                  <p className="text-sm text-muted-foreground">{selectedItem.permissions.ai_training}</p>
                </div>
                {selectedItem.permissions.allowed_use_cases.length > 0 && (
                  <div>
                    <p className="font-medium mb-1">Allowed Use Cases</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.permissions.allowed_use_cases.map((uc) => (
                        <span key={uc} className="px-2 py-1 text-xs rounded-sm bg-accent">
                          {uc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="font-medium mb-1">Attribution Required</p>
                  <p className="text-sm text-muted-foreground">{selectedItem.permissions.attribution ? 'Yes' : 'No'}</p>
                </div>
                {selectedItem.permissions.notes && (
                  <div>
                    <p className="font-medium mb-1">Notes</p>
                    <p className="text-sm text-muted-foreground">{selectedItem.permissions.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No specific terms available.</p>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAgreementModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

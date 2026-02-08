import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { FileDropzone } from '@/components/FileDropzone';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { apiClient, ApiError } from '@/lib/apiClient';
import type { ArtistPermissions } from '@/lib/apiTypes';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ListenForHelp } from '@/components/ListenForHelp';

type TrainingPermission = 'yes' | 'no' | 'conditional';

const useCases = [
  { id: 'general', label: 'General Training' },
  { id: 'fine_tuning', label: 'Fine-tuning' },
  { id: 'style_learning', label: 'Style Learning' },
  { id: 'commercial', label: 'Commercial Use' },
  { id: 'research', label: 'Research Only' },
  { id: 'other', label: 'Other' },
];

export default function ArtistCreateTag() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [files, setFiles] = useState<File[]>([]);
  const [trainingPermission, setTrainingPermission] = useState<TrainingPermission>('conditional');
  const [allowedUseCases, setAllowedUseCases] = useState<string[]>(['research']);
  const [otherUseCaseText, setOtherUseCaseText] = useState('');
  const [attributionRequired, setAttributionRequired] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUseCaseToggle = (useCaseId: string) => {
    setAllowedUseCases((prev) =>
      prev.includes(useCaseId)
        ? prev.filter((id) => id !== useCaseId)
        : [...prev, useCaseId]
    );
    // Clear other text when unchecking "other"
    if (useCaseId === 'other' && allowedUseCases.includes('other')) {
      setOtherUseCaseText('');
    }
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast({
        title: 'No file selected',
        description: 'Please upload an artwork to generate a tag.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const permissions: ArtistPermissions = {
        ai_training: trainingPermission,
        allowed_use_cases: trainingPermission === 'conditional' ? allowedUseCases : [],
        attribution: attributionRequired,
        notes: notes.trim() || undefined,
        other_use_case: allowedUseCases.includes('other') ? otherUseCaseText.trim() : undefined,
      };

      await apiClient.uploadArtwork(files, permissions);

      setIsSuccess(true);
      toast({
        title: 'Security tag created!',
        description: 'Your artwork is now protected with a unique security tag.',
      });

      // Redirect after short delay
      setTimeout(() => {
        navigate('/artist/artworks');
      }, 1500);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not create security tag. Please try again.';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 animate-scale-in">
          <div className="p-4 rounded-sm bg-status-allowed/10 mb-6">
            <CheckCircle className="h-12 w-12 text-status-allowed" />
          </div>
          <h2 className="font-serif text-2xl font-semibold mb-2">Tag Created Successfully!</h2>
          <p className="text-muted-foreground mb-4">Redirecting to your artworks...</p>
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <p className="ink-section-title">New Tag</p>
        <h1 className="font-serif text-2xl font-semibold mb-1">Create Security Tag</h1>
        <p className="text-muted-foreground">
          Upload your artwork and set permissions for AI training use
        </p>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 p-4 rounded-sm bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Upload */}
        <div className="space-y-6">
          <div className="ink-card">
            <h2 className="font-serif text-lg font-semibold mb-4">Upload Artwork</h2>
            <FileDropzone
              onFilesSelected={setFiles}
              accept="image/*"
              multiple
            />
            {files.length > 1 && (
              <p className="text-sm text-muted-foreground mt-2">
                {files.length} files selected for batch upload
              </p>
            )}
          </div>
        </div>

        {/* Right: Permissions */}
        <div className="space-y-6">
          {/* Training Permission */}
          <div className="ink-card">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-serif text-lg font-semibold">AI Training Permission</h2>
              <ListenForHelp
                title="Permission Settings"
                explanation="Choose how AI companies can use your artwork. 'Allow' means anyone can train on it freely. 'Conditional' lets you specify exactly which uses are permitted, like research only or requiring attribution. 'Deny' blocks all AI training. You can change these settings anytime."
              />
            </div>
            
            <div className="grid grid-cols-3 gap-2 mb-6">
              <button
                onClick={() => setTrainingPermission('yes')}
                className={cn(
                  'py-3 px-4 rounded-sm border-2 font-medium transition-all text-sm',
                  trainingPermission === 'yes'
                    ? 'border-status-allowed bg-status-allowed/10 text-status-allowed'
                    : 'border-border hover:border-muted-foreground/30'
                )}
              >
                Allow
              </button>
              <button
                onClick={() => setTrainingPermission('conditional')}
                className={cn(
                  'py-3 px-4 rounded-sm border-2 font-medium transition-all text-sm',
                  trainingPermission === 'conditional'
                    ? 'border-status-conditional bg-status-conditional/10 text-status-conditional'
                    : 'border-border hover:border-muted-foreground/30'
                )}
              >
                Conditional
              </button>
              <button
                onClick={() => setTrainingPermission('no')}
                className={cn(
                  'py-3 px-4 rounded-sm border-2 font-medium transition-all text-sm',
                  trainingPermission === 'no'
                    ? 'border-status-restricted bg-status-restricted/10 text-status-restricted'
                    : 'border-border hover:border-muted-foreground/30'
                )}
              >
                Deny
              </button>
            </div>

            {/* Conditional Use Cases */}
            {trainingPermission === 'conditional' && (
              <div className="space-y-3 p-4 rounded-sm bg-accent/50 animate-fade-in">
                <Label className="text-sm font-medium">Allowed Use Cases</Label>
                <div className="grid grid-cols-2 gap-3">
                  {useCases.map((useCase) => (
                    <div key={useCase.id} className="flex items-center space-x-2">
                      {useCase.id === 'other' ? (
                        <Popover open={allowedUseCases.includes('other')}>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={useCase.id}
                              checked={allowedUseCases.includes(useCase.id)}
                              onCheckedChange={() => handleUseCaseToggle(useCase.id)}
                            />
                            <PopoverTrigger asChild>
                              <label
                                htmlFor={useCase.id}
                                className="text-sm cursor-pointer"
                              >
                                {useCase.label}
                              </label>
                            </PopoverTrigger>
                          </div>
                          <PopoverContent className="w-80" align="start">
                            <div className="space-y-2">
                              <Label htmlFor="other-use-case" className="text-sm font-medium">
                                Specify allowed use case
                              </Label>
                              <Input
                                id="other-use-case"
                                placeholder="e.g., Educational materials only..."
                                value={otherUseCaseText}
                                onChange={(e) => setOtherUseCaseText(e.target.value)}
                                className="text-sm"
                              />
                              <p className="text-xs text-muted-foreground">
                                Describe what is allowed if not listed above
                              </p>
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <>
                          <Checkbox
                            id={useCase.id}
                            checked={allowedUseCases.includes(useCase.id)}
                            onCheckedChange={() => handleUseCaseToggle(useCase.id)}
                          />
                          <label
                            htmlFor={useCase.id}
                            className="text-sm cursor-pointer"
                          >
                            {useCase.label}
                          </label>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Attribution */}
          <div className="ink-card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Attribution Required</h3>
                <p className="text-sm text-muted-foreground">
                  Require credit when your artwork is used
                </p>
              </div>
              <Switch
                checked={attributionRequired}
                onCheckedChange={setAttributionRequired}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="ink-card">
            <Label htmlFor="notes" className="font-medium">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional terms or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-2 rounded-sm"
            />
          </div>

          {/* Submit */}
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={handleSubmit}
            disabled={files.length === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Tag{files.length > 1 ? 's' : ''}...
              </>
            ) : (
              <>
                <Tag className="h-4 w-4" />
                Generate Security Tag{files.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

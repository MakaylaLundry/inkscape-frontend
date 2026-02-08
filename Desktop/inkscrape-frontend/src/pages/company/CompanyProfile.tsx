import { useState, useEffect } from 'react';
import { Building2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiClient, ApiError } from '@/lib/apiClient';
import type { CompanyProfile as CompanyProfileType } from '@/lib/apiTypes';

const useCaseOptions = [
  { value: 'general_llm', label: 'General LLM Training' },
  { value: 'image_gen', label: 'Image Generation' },
  { value: 'research', label: 'Research' },
  { value: 'fine_tuning', label: 'Fine-tuning' },
  { value: 'other', label: 'Other' },
];

export default function CompanyProfile() {
  const { toast } = useToast();

  const [companyName, setCompanyName] = useState('');
  const [declaredUseCases, setDeclaredUseCases] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const profile = await apiClient.getCompanyProfile();
      setCompanyName(profile.company_name || '');
      setDeclaredUseCases(profile.declared_use_cases || []);
      setDescription(profile.description || '');
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // Profile doesn't exist yet, that's okay
      } else {
        setError('Could not load profile. Please try again.');
        console.error('Error loading profile:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseCaseToggle = (value: string) => {
    setDeclaredUseCases((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  const handleSave = async () => {
    if (!companyName.trim()) {
      toast({
        title: 'Company name required',
        description: 'Please enter your company name.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    setError(null);
    
    try {
      await apiClient.updateCompanyProfile({
        company_name: companyName.trim(),
        declared_use_cases: declaredUseCases,
        description: description.trim() || undefined,
      });

      setIsSaved(true);
      toast({
        title: 'Profile updated',
        description: 'Your company profile has been saved.',
      });

      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not save profile.';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <p className="ink-section-title">Settings</p>
        <h1 className="font-serif text-2xl font-semibold mb-1">Company Profile</h1>
        <p className="text-muted-foreground">
          Set up your company information for compliance tracking
        </p>
      </div>

      <div className="max-w-xl">
        {error && (
          <div className="mb-6 p-4 rounded-sm bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="ink-card space-y-6">
          {/* Company Icon */}
          <div className="flex items-center gap-4 pb-6 border-b border-border">
            <div className="p-4 rounded-sm bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="font-serif font-semibold">Company Details</h2>
              <p className="text-sm text-muted-foreground">
                This information helps artists understand who is using their work
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                placeholder="Your company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="rounded-sm"
              />
            </div>

            <div className="space-y-3">
              <Label>Declared Use Cases</Label>
              <div className="grid grid-cols-2 gap-3">
                {useCaseOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.value}
                      checked={declaredUseCases.includes(option.value)}
                      onCheckedChange={() => handleUseCaseToggle(option.value)}
                    />
                    <label
                      htmlFor={option.value}
                      className="text-sm cursor-pointer"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Briefly describe your AI project or company..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="rounded-sm"
              />
            </div>
          </div>

          {/* Save Button */}
          <Button
            className="w-full gap-2"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isSaved ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Saved!
              </>
            ) : (
              'Save Profile'
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

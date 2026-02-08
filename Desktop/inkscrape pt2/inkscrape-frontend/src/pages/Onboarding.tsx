import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Palette, Building2, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { InkAccent } from '@/components/InkAccent';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Onboarding() {
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setRole, isAuthenticated, isLoading, isRoleLoading, role } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated (after loading is complete)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Redirect if user already has a role (skip onboarding)
  useEffect(() => {
    if (!isLoading && !isRoleLoading && isAuthenticated && role) {
      const path = role === 'artist' ? '/artist/artworks' : '/company/profile';
      navigate(path);
    }
  }, [isLoading, isRoleLoading, isAuthenticated, role, navigate]);

  // Show loading state while Auth0 is checking session or fetching role
  if (isLoading || isRoleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const handleContinue = async () => {
    if (!selectedRole) return;
    
    setIsSubmitting(true);
    try {
      // Save role to backend (this will persist it)
      await setRole(selectedRole);
      
      // Navigate to appropriate dashboard
      const path = selectedRole === 'artist' ? '/artist/artworks' : '/company/profile';
      navigate(path);
    } catch (error) {
      console.error('Failed to save role:', error);
      setIsSubmitting(false);
    }
  };

  const roles = [
    {
      id: 'artist' as UserRole,
      title: 'I am an Artist',
      description: 'I create artwork and want to control how it\'s used in AI training.',
      icon: Palette,
      features: ['Upload & tag artwork', 'Set AI permissions', 'Track usage'],
      color: 'ink-teal',
    },
    {
      id: 'company' as UserRole,
      title: 'I represent a Company',
      description: 'I work on AI projects and need to ensure ethical data sourcing.',
      icon: Building2,
      features: ['Scan datasets', 'Check compliance', 'Generate agreements'],
      color: 'primary',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
      <InkAccent variant="stroke" position="top-right" className="text-foreground" />
      
      <div className="w-full max-w-2xl">
        {/* Logo - Editorial masthead style */}
        <div className="flex items-center justify-center mb-12">
          <Logo size="lg" />
        </div>

        {/* Title */}
        <div className="text-center mb-10 animate-fade-in">
          <p className="ink-section-title">Getting Started</p>
          <h1 className="font-serif text-3xl font-semibold mb-3">How will you use Inkscape?</h1>
          <p className="text-muted-foreground">
            Choose your role to get a personalized experience.
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={cn(
                'ink-card text-left transition-all duration-200 cursor-pointer p-6',
                'hover:border-primary/50',
                selectedRole === role.id
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'hover:border-muted-foreground/30'
              )}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={cn(
                  'p-3 rounded-sm',
                  role.id === 'artist' ? 'bg-ink-teal/10 text-ink-teal' : 'bg-primary/10 text-primary'
                )}>
                  <role.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-lg font-semibold mb-1">{role.title}</h3>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {role.features.map((feature) => (
                  <span
                    key={feature}
                    className="px-2.5 py-1 text-xs font-medium rounded-sm bg-accent text-muted-foreground"
                  >
                    {feature}
                  </span>
                ))}
              </div>

              {/* Selection indicator */}
              <div className={cn(
                'absolute top-4 right-4 w-5 h-5 rounded-sm border-2 transition-colors',
                selectedRole === role.id
                  ? 'border-primary bg-primary'
                  : 'border-border'
              )}>
                {selectedRole === role.id && (
                  <svg className="w-full h-full text-primary-foreground" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Continue Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            disabled={!selectedRole || isSubmitting}
            onClick={handleContinue}
            className="gap-2 min-w-[200px]"
          >
            {isSubmitting ? 'Setting up...' : 'Continue'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

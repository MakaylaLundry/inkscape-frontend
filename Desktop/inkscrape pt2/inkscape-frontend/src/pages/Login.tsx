import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AccessibilitySettings } from '@/components/AccessibilitySettings';
import { Logo } from '@/components/Logo';
import { InkAccent } from '@/components/InkAccent';
import { Button } from '@/components/ui/button';

export default function Login() {
  const { login, isAuthenticated, isLoading, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If already authenticated, redirect based on role
    if (isAuthenticated && !isLoading) {
      if (role) {
        navigate(role === 'artist' ? '/artist/artworks' : '/company/scan');
      } else {
        navigate('/onboarding');
      }
    }
  }, [isAuthenticated, isLoading, role, navigate]);

  const handleLogin = async () => {
    await login();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Editorial masthead */}
      <header className="p-4">
        <div className="container max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/">
            <Logo size="md" />
          </Link>
          <AccessibilitySettings />
        </div>
      </header>

      {/* Login Form */}
      <main className="flex-1 flex items-center justify-center p-4 relative">
        <InkAccent variant="stroke" position="top-right" className="text-foreground" />
        
        <div className="w-full max-w-md">
          <div className="ink-card p-8 animate-fade-in">
            <div className="text-center mb-8">
              <p className="ink-section-title">Welcome Back</p>
              <h1 className="font-serif text-2xl font-semibold mb-2">Sign in to Inkscape</h1>
              <p className="text-muted-foreground text-sm">Continue protecting creative work</p>
            </div>

            <div className="space-y-4">
              <Button onClick={handleLogin} className="w-full" size="lg">
                Sign in with Auth0
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-primary hover:underline font-medium">
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Play, 
  ArrowLeft,
  Wifi,
  Shield,
  User
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/apiClient';
import { API_BASE_URL } from '@/lib/apiConfig';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  details?: string;
}

export default function IntegrationCheck() {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Health Check (Unauthenticated)', status: 'pending' },
    { name: 'Auth Me (Authenticated)', status: 'pending' },
    { name: 'Role-Based Endpoint', status: 'pending' },
  ]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTest = useCallback((index: number, update: Partial<TestResult>) => {
    setTests(prev => prev.map((t, i) => i === index ? { ...t, ...update } : t));
  }, []);

  const runTests = async () => {
    setIsRunning(true);
    
    // Reset all tests
    setTests(prev => prev.map(t => ({ ...t, status: 'pending', message: undefined, details: undefined })));

    // Test 1: Health Check (No Auth)
    updateTest(0, { status: 'running' });
    try {
      const healthResult = await apiClient.checkHealth();
      if (healthResult.ok) {
        updateTest(0, { 
          status: 'success', 
          message: 'Backend is reachable and healthy',
          details: JSON.stringify(healthResult, null, 2)
        });
      } else {
        updateTest(0, { 
          status: 'error', 
          message: 'Health check returned ok: false',
          details: JSON.stringify(healthResult, null, 2)
        });
      }
    } catch (error) {
      const apiError = error instanceof ApiError ? error : ApiError.fromNetworkError(error as Error);
      updateTest(0, { 
        status: 'error', 
        message: apiError.message,
        details: apiError.status === 0 
          ? 'This could be a CORS issue or the server is unreachable'
          : `Status: ${apiError.status}`
      });
    }

    // Test 2: Auth Me (Authenticated)
    updateTest(1, { status: 'running' });
    if (!apiClient.hasToken()) {
      updateTest(1, { 
        status: 'error', 
        message: 'No access token set',
        details: isAuthenticated 
          ? 'Token should have been set after Auth0 login. Check AuthContext.'
          : 'User is not logged in. Please log in first.'
      });
    } else {
      try {
        const authResult = await apiClient.getAuthMe();
        updateTest(1, { 
          status: 'success', 
          message: `Authenticated as: ${authResult.data?.sub || 'unknown'}`,
          details: JSON.stringify(authResult, null, 2)
        });
      } catch (error) {
        const apiError = error instanceof ApiError ? error : ApiError.fromNetworkError(error as Error);
        let details = `Status: ${apiError.status}`;
        if (apiError.status === 401) {
          details = 'Auth token not attached or audience mismatch. Check VITE_AUTH0_AUDIENCE.';
        } else if (apiError.status === 0) {
          details = 'Network error - possibly CORS blocked';
        }
        updateTest(1, { 
          status: 'error', 
          message: apiError.message,
          details
        });
      }
    }

    // Test 3: Role-Based Endpoint
    updateTest(2, { status: 'running' });
    if (!apiClient.hasToken()) {
      updateTest(2, { 
        status: 'error', 
        message: 'No access token set',
        details: 'Cannot test role-based endpoint without auth token'
      });
    } else {
      try {
        // Use the appropriate endpoint based on current role
        const endpoint = role === 'company' ? 'Company Stub' : 'Artist Stub';
        const result = role === 'company' 
          ? await apiClient.checkCompanyAccess()
          : await apiClient.checkArtistAccess();
        
        updateTest(2, { 
          status: 'success', 
          message: `${endpoint} access granted`,
          details: JSON.stringify(result, null, 2)
        });
      } catch (error) {
        const apiError = error instanceof ApiError ? error : ApiError.fromNetworkError(error as Error);
        let details = `Status: ${apiError.status}`;
        if (apiError.status === 403) {
          details = `Role mismatch: your role is "${role || 'not set'}" but endpoint requires different role`;
        } else if (apiError.status === 401) {
          details = 'Auth token invalid or expired';
        }
        updateTest(2, { 
          status: 'error', 
          message: apiError.message,
          details
        });
      }
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <div className="h-5 w-5 rounded-full border-2 border-muted" />;
      case 'running':
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-status-allowed" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-status-restricted" />;
    }
  };

  const getTestIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Wifi className="h-4 w-4" />;
      case 1:
        return <User className="h-4 w-4" />;
      case 2:
        return <Shield className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const allPassed = tests.every(t => t.status === 'success');
  const hasErrors = tests.some(t => t.status === 'error');

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <h1 className="font-serif text-2xl font-semibold mb-2">Integration Check</h1>
          <p className="text-muted-foreground">
            Verify frontend-backend connectivity and authentication
          </p>
        </div>

        {/* API Info Card */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">API Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Base URL:</span>
              <code className="font-mono text-xs bg-muted px-2 py-1 rounded">{API_BASE_URL}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Auth Token:</span>
              <span className={cn(
                'text-xs font-medium',
                apiClient.hasToken() ? 'text-status-allowed' : 'text-status-restricted'
              )}>
                {apiClient.hasToken() ? 'Set' : 'Not Set'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">User Logged In:</span>
              <span className={cn(
                'text-xs font-medium',
                isAuthenticated ? 'text-status-allowed' : 'text-muted-foreground'
              )}>
                {isAuthenticated ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current Role:</span>
              <span className="text-xs font-medium">{role || 'None'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Tests Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Connectivity Tests</CardTitle>
            <CardDescription>
              Run these tests to verify the integration is working correctly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tests.map((test, index) => (
                <div 
                  key={test.name}
                  className={cn(
                    'p-4 rounded-sm border',
                    test.status === 'success' && 'border-status-allowed/30 bg-status-allowed/5',
                    test.status === 'error' && 'border-status-restricted/30 bg-status-restricted/5',
                    (test.status === 'pending' || test.status === 'running') && 'border-border'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getStatusIcon(test.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getTestIcon(index)}
                        <span className="font-medium text-sm">{test.name}</span>
                      </div>
                      {test.message && (
                        <p className={cn(
                          'text-sm',
                          test.status === 'success' ? 'text-status-allowed' : 
                          test.status === 'error' ? 'text-status-restricted' : 
                          'text-muted-foreground'
                        )}>
                          {test.message}
                        </p>
                      )}
                      {test.details && (
                        <pre className="mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded overflow-x-auto">
                          {test.details}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-4">
              <Button 
                onClick={runTests} 
                disabled={isRunning}
                className="gap-2"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run Tests
                  </>
                )}
              </Button>

              {!isRunning && tests[0].status !== 'pending' && (
                <span className={cn(
                  'text-sm font-medium',
                  allPassed ? 'text-status-allowed' : hasErrors ? 'text-status-restricted' : 'text-muted-foreground'
                )}>
                  {allPassed ? '✓ All tests passed' : hasErrors ? '✗ Some tests failed' : 'Tests completed'}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Health check fails:</strong>{' '}
              Verify the backend is running at {API_BASE_URL} and CORS is configured to allow requests from this origin.
            </p>
            <p>
              <strong className="text-foreground">Auth endpoint returns 401:</strong>{' '}
              Check that VITE_AUTH0_AUDIENCE matches your Auth0 API identifier. The token audience must match.
            </p>
            <p>
              <strong className="text-foreground">Role endpoint returns 403:</strong>{' '}
              Your current role doesn't match the endpoint. Artists can only access artist endpoints, companies can only access company endpoints.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

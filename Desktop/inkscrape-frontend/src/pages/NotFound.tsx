import { Link } from 'react-router-dom';
import { Shield, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <span className="text-xl font-semibold">Inkscape</span>
        </div>

        {/* 404 Content */}
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Page not found</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <Link to="/">
          <Button className="gap-2">
            <Home className="h-4 w-4" />
            Back to home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

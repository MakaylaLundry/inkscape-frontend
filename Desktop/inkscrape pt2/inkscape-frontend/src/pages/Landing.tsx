import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Palette, CheckCircle } from 'lucide-react';
import { AccessibilitySettings } from '@/components/AccessibilitySettings';
import { Logo } from '@/components/Logo';
import { InkAccent, InkDivider } from '@/components/InkAccent';
import { Button } from '@/components/ui/button';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header - Editorial masthead style */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <Logo size="md" />
          </Link>
          
          <div className="flex items-center gap-3">
            <AccessibilitySettings />
            <Link to="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link to="/signup">
              <Button>Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Editorial layout with strong vertical rhythm */}
      <section className="pt-32 pb-24 px-4 relative overflow-hidden">
        <InkAccent variant="curve" position="top-right" className="text-foreground" />
        
        <div className="container max-w-4xl mx-auto text-center relative">
          <p className="ink-section-title mb-6">
            Ethical AI Data Sourcing
          </p>
          
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6 leading-tight">
            Protect your creative work.
            <br />
            <span className="text-muted-foreground">Build AI responsibly.</span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Inkscape bridges artists and AI companies with transparent permission controls,
            ensuring fair use and proper attribution for creative works in AI training datasets.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="gap-2">
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Learn how it works
            </Button>
          </div>
        </div>
      </section>

      <InkDivider className="max-w-4xl mx-auto" />

      {/* Features Grid - Editorial blocks */}
      <section className="py-20 px-4 relative">
        <InkAccent variant="dots" position="bottom-left" className="text-foreground" />
        
        <div className="container max-w-6xl mx-auto">
          <p className="ink-section-title text-center">Two Perspectives</p>
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-center mb-12">
            One platform. Both sides of the story.
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Artist Card */}
            <div className="ink-card-hover group p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-sm bg-ink-teal/10 text-ink-teal">
                  <Palette className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-semibold">For Artists</h3>
                  <p className="text-sm text-muted-foreground">Protect & control your work</p>
                </div>
              </div>
              
              <ul className="space-y-3 mb-6">
                {[
                  'Upload artwork and generate security tags',
                  'Set granular AI training permissions',
                  'Track how your art is being used',
                  'Receive proper attribution',
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <CheckCircle className="h-5 w-5 text-ink-teal shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link to="/signup?role=artist">
                <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  Join as Artist
                </Button>
              </Link>
            </div>

            {/* Company Card */}
            <div className="ink-card-hover group p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-sm bg-primary/10 text-primary">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-semibold">For Companies</h3>
                  <p className="text-sm text-muted-foreground">Source data ethically</p>
                </div>
              </div>
              
              <ul className="space-y-3 mb-6">
                {[
                  'Scan datasets for compliance issues',
                  'Identify restricted or conditional content',
                  'Generate usage agreements automatically',
                  'Build AI models with verified permissions',
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link to="/signup?role=company">
                <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  Join as Company
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <InkDivider className="max-w-4xl mx-auto" />

      {/* How it works - Editorial numbered sections */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="container max-w-4xl mx-auto">
          <p className="ink-section-title text-center">The Process</p>
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-center mb-12">
            How it works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Tag your work',
                description: 'Artists upload their creations and set permission levels for AI training use.',
              },
              {
                step: '02',
                title: 'Scan datasets',
                description: 'Companies scan their training data to identify works with security tags.',
              },
              {
                step: '03',
                title: 'Respect & comply',
                description: 'Follow permissions, generate agreements, and build AI responsibly.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-sm bg-primary/10 text-primary font-serif font-bold text-lg mb-4">
                  {item.step}
                </div>
                <h3 className="font-serif text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer - Editorial style */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Logo size="sm" />
            <span className="ml-2">— Ethical AI Data Sourcing</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Inkscape. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

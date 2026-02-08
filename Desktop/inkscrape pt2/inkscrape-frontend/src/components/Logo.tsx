import { useContext } from 'react';
import logoLight from '@/assets/logo-light.png';
import { cn } from '@/lib/utils';
interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: 'sm' | 'md' | 'lg';
}
export function Logo({
  className,
  showWordmark = true,
  size = 'md'
}: LogoProps) {
  // Check if we're in dark mode by looking at the document class
  // This avoids the dependency on AccessibilityContext and makes Logo more portable
  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-14'
  };
  const wordmarkSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  // The logo is white on black - in light mode we invert it, in dark mode we use it as-is
  const shouldInvert = !isDarkMode;
  return <div className={cn('ink-masthead flex items-center gap-1', className)}>
      <img src={logoLight} alt="Inkscape" className={cn(sizeClasses[size], 'w-auto transition-all duration-200',
    // Use dark: variant for automatic theme-aware inversion
    'invert dark:invert-0')} />
      {showWordmark && <span className={cn("font-serif font-semibold tracking-tight text-2xl mt-1", wordmarkSizes[size])}>
          Inkscape
        </span>}
    </div>;
}

// Minimal icon-only version for tight spaces
export function LogoIcon({
  className,
  size = 'md'
}: Omit<LogoProps, 'showWordmark'>) {
  return <Logo className={className} size={size} showWordmark={false} />;
}
import { cn } from '@/lib/utils';

interface InkAccentProps {
  variant?: 'stroke' | 'curve' | 'dots';
  position?: 'top-right' | 'bottom-left' | 'center';
  className?: string;
}

/**
 * Subtle ink-like decorative element for editorial feel.
 * Used sparingly (1-2 per page max) as marginalia-style accents.
 */
export function InkAccent({ variant = 'stroke', position = 'top-right', className }: InkAccentProps) {
  const positionClasses = {
    'top-right': 'top-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  };

  if (variant === 'stroke') {
    return (
      <svg 
        className={cn(
          'absolute pointer-events-none opacity-[0.04] w-48 h-24',
          positionClasses[position],
          className
        )}
        viewBox="0 0 200 100" 
        fill="none"
      >
        <path 
          d="M10 60 Q 40 25, 80 55 T 150 45 T 190 55" 
          stroke="currentColor" 
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    );
  }

  if (variant === 'curve') {
    return (
      <svg 
        className={cn(
          'absolute pointer-events-none opacity-[0.03] w-64 h-32',
          positionClasses[position],
          className
        )}
        viewBox="0 0 260 130" 
        fill="none"
      >
        <path 
          d="M5 80 C 50 10, 120 120, 180 60 S 240 90, 255 70" 
          stroke="currentColor" 
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
        />
        <path 
          d="M20 90 C 60 50, 100 110, 150 70" 
          stroke="currentColor" 
          strokeWidth="0.75"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
      </svg>
    );
  }

  if (variant === 'dots') {
    return (
      <svg 
        className={cn(
          'absolute pointer-events-none opacity-[0.05] w-24 h-24',
          positionClasses[position],
          className
        )}
        viewBox="0 0 100 100" 
        fill="none"
      >
        <circle cx="20" cy="30" r="2" fill="currentColor" />
        <circle cx="50" cy="45" r="1.5" fill="currentColor" />
        <circle cx="75" cy="35" r="2.5" fill="currentColor" />
        <circle cx="35" cy="65" r="1.5" fill="currentColor" />
        <circle cx="65" cy="70" r="2" fill="currentColor" />
      </svg>
    );
  }

  return null;
}

/**
 * Horizontal rule with editorial ink styling
 */
export function InkDivider({ className }: { className?: string }) {
  return (
    <div className={cn('ink-divider', className)} aria-hidden="true" />
  );
}

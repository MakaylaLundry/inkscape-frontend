import { cn } from '@/lib/utils';
import { Check, X, Info } from 'lucide-react';

type Status = 'allowed' | 'restricted' | 'conditional' | 'yes' | 'no';

interface StatusBadgeProps {
  status: Status;
  className?: string;
  showIcon?: boolean;
}

const statusConfig: Record<Status, { label: string; className: string; Icon: typeof Check }> = {
  allowed: {
    label: 'Allowed',
    className: 'bg-status-allowed text-status-allowed-foreground',
    Icon: Check,
  },
  yes: {
    label: 'Allowed',
    className: 'bg-status-allowed text-status-allowed-foreground',
    Icon: Check,
  },
  conditional: {
    label: 'Conditional',
    className: 'bg-status-conditional text-status-conditional-foreground',
    Icon: Info,
  },
  restricted: {
    label: 'Restricted',
    className: 'bg-status-restricted text-status-restricted-foreground',
    Icon: X,
  },
  no: {
    label: 'Restricted',
    className: 'bg-status-restricted text-status-restricted-foreground',
    Icon: X,
  },
};

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status];
  const IconComponent = config.Icon;
  
  return (
    <span
      className={cn(
        // Editorial: squared badge, not pill-shaped
        // Icon always shown for colorblind accessibility
        'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs font-semibold border border-current/20',
        config.className,
        className
      )}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      {showIcon && (
        <IconComponent className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2.5} aria-hidden="true" />
      )}
      <span className="font-semibold">{config.label}</span>
    </span>
  );
}

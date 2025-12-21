import { DraftStatus } from '@/types/draft';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: DraftStatus;
  className?: string;
}

const statusConfig: Record<DraftStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-[hsl(var(--status-pending))] text-[hsl(var(--status-pending-foreground))]',
  },
  draft_generated: {
    label: 'Generated',
    className: 'bg-[hsl(var(--status-generated))] text-[hsl(var(--status-generated-foreground))]',
  },
  draft_edited: {
    label: 'Edited',
    className: 'bg-[hsl(var(--status-edited))] text-[hsl(var(--status-edited-foreground))]',
  },
  sent: {
    label: 'Sent',
    className: 'bg-[hsl(var(--status-sent))] text-[hsl(var(--status-sent-foreground))]',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-[hsl(var(--status-rejected))] text-[hsl(var(--status-rejected-foreground))]',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
};
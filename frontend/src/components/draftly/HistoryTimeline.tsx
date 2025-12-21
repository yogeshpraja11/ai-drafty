import { HistoryEntry } from '@/types/draft';
import { format } from 'date-fns';
import { Clock, Edit, Check, X, Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HistoryTimelineProps {
  history: HistoryEntry[];
}

const actionConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  created: { icon: Sparkles, color: 'text-[hsl(var(--status-generated))]', label: 'Draft created' },
  edited: { icon: Edit, color: 'text-[hsl(var(--status-edited))]', label: 'Draft edited' },
  approved: { icon: Check, color: 'text-[hsl(var(--status-sent))]', label: 'Draft approved' },
  rejected: { icon: X, color: 'text-[hsl(var(--status-rejected))]', label: 'Draft rejected' },
  sent: { icon: Send, color: 'text-[hsl(var(--status-sent))]', label: 'Email sent' },
};

export const HistoryTimeline: React.FC<HistoryTimelineProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        No history available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((entry, index) => {
        const config = actionConfig[entry.action] || actionConfig.created;
        const Icon = config.icon;

        const date = new Date(entry.timestamp);
        const dateStr = !isNaN(date.getTime()) ? format(date, 'MMM d, h:mm a') : 'Unknown date';

        return (
          <div key={entry.id || index} className="relative pl-6 pb-6 last:pb-0 border-l border-border last:border-0">
            <div className="absolute -left-3 top-0 flex flex-col items-center">
              <div className={cn('p-1.5 rounded-full bg-muted', config.color)}>
                <Icon className="h-3 w-3" />
              </div>
              {index < history.length - 1 && (
                <div className="w-px h-full bg-border mt-2" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{config.label}</span>
              <span className="text-xs text-muted-foreground">{dateStr}</span>
              {entry.details && (
                <div className="text-xs text-muted-foreground mt-1">
                  {typeof entry.details === 'string' ? (
                    entry.details
                  ) : (
                    // Handle object details safely
                    <div className="flex flex-col gap-0.5">
                      {(entry.details as any).from && <span>From: {(entry.details as any).from}</span>}
                      {(entry.details as any).subject && <span>Subject: {(entry.details as any).subject}</span>}
                      {(entry.details as any).tone && <span>Tone: {(entry.details as any).tone}</span>}
                      {(entry.details as any).via && <span>Via: {(entry.details as any).via}</span>}
                      {/* Fallback for other keys if needed, or arguably just don't render them to avoid clutter */}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
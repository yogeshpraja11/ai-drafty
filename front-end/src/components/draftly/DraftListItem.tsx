import { Draft } from '@/types/draft';
import { format, isToday, isThisYear } from 'date-fns';
import { cn } from '@/lib/utils';
import { Star, Square, Archive, Trash2, Mail, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DraftListItemProps {
  draft: Draft;
  isSelected: boolean;
  onClick: () => void;
  onQuickApprove?: () => void; // Kept for interface compatibility but might not be visible in row view immediately
  onQuickReject?: () => void;
}

export const DraftListItem: React.FC<DraftListItemProps> = ({
  draft,
  isSelected,
  onClick,
  onQuickApprove,
  onQuickReject,
}) => {
  const senderName = draft.originalEmail.from.split('<')[0].trim() || draft.originalEmail.from;

  // Gmail date formatting
  let dateDate = new Date(draft.originalEmail.timestamp);
  // Defend against invalid dates
  if (isNaN(dateDate.getTime())) {
    dateDate = new Date(); // Fallback to now
  }

  let dateStr = '';
  if (isToday(dateDate)) {
    dateStr = format(dateDate, 'h:mm a');
  } else if (isThisYear(dateDate)) {
    dateStr = format(dateDate, 'MMM d');
  } else {
    dateStr = format(dateDate, 'M/d/yy');
  }

  // Snippet generation (from body or draft text if body missing)
  // We prefer the original body for the "snippet" to look like Gmail reading the email
  const snippetText = (draft.originalEmail.body || draft.draftText || '').replace(/\s+/g, ' ').substring(0, 100);

  return (
    <div
      className={cn(
        'group flex items-center gap-3 px-4 py-2 border-b border-border cursor-pointer transition-colors hover:shadow-sm relative', // relative for actions
        'hover:bg-muted/50', // lightly gray on hover
        isSelected ? 'bg-[#c2dbff] dark:bg-[#2c3b52]' : 'bg-background', // Gmail-ish blue selection
        // Font styles
        draft.status === 'pending' || draft.status === 'draft_generated' ? 'font-bold' : 'font-normal'
      )}
      onClick={onClick}
    >
      {/* Checkbox & Star (Visual for now) */}
      <div className="flex items-center gap-2 text-muted-foreground/40">
        <div className="p-1 hover:bg-muted rounded cursor-default" onClick={(e) => e.stopPropagation()}>
          <Square className="h-4 w-4" />
        </div>
        <div className="p-1 hover:bg-muted rounded cursor-default" onClick={(e) => e.stopPropagation()}>
          <Star className="h-4 w-4 hover:text-yellow-400" />
        </div>
      </div>

      {/* Sender */}
      <div className={cn("w-[160px] md:w-[200px] truncate text-sm", isSelected ? 'text-foreground' : 'text-foreground')}>
        {senderName}
      </div>

      {/* Subject and Snippet */}
      <div className="flex-1 flex items-center min-w-0 text-sm">
        <span className={cn("truncate",
          (draft.status === 'pending' || draft.status === 'draft_generated') ? 'text-foreground' : 'text-foreground'
        )}>
          {draft.originalEmail.subject || '(No Subject)'}
        </span>
        <span className="mx-1 text-muted-foreground font-normal">-</span>
        <span className="truncate text-muted-foreground font-normal">
          {snippetText}
        </span>
      </div>

      {/* Date (Visible by default, hidden on hover) */}
      <div className={cn("w-[80px] text-right text-xs font-semibold group-hover:hidden",
        (draft.status === 'pending' || draft.status === 'draft_generated') ? 'text-foreground' : 'text-muted-foreground'
      )}>
        {dateStr}
      </div>

      {/* Actions (Hidden by default, visible on hover) */}
      <div className="hidden group-hover:flex items-center justify-end w-[100px] gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 hover:bg-muted rounded-full"
          onClick={(e) => { e.stopPropagation(); onQuickApprove?.(); }}
          title="Approve & Send"
        >
          <Mail className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 hover:bg-muted rounded-full"
          onClick={(e) => { e.stopPropagation(); onQuickReject?.(); }}
          title="Reject"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 hover:bg-muted rounded-full"
          title="Archive"
        >
          <Archive className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 hover:bg-muted rounded-full"
          title="Snooze"
        >
          <Clock className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
import { Inbox, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-drafts' | 'no-selection';
  filterLabel?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type, filterLabel }) => {
  if (type === 'no-drafts') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="p-4 rounded-full bg-muted mb-4">
          <Inbox className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-lg mb-2">No drafts found</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {filterLabel
            ? `No ${filterLabel.toLowerCase()} drafts at the moment. Drafts will appear here when new emails arrive.`
            : 'No drafts available. When new emails arrive, AI-generated reply drafts will appear here.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="p-4 rounded-full bg-[hsl(var(--draftly-ai))]/10 mb-4">
        <Sparkles className="h-8 w-8 text-[hsl(var(--draftly-ai))]" />
      </div>
      <h3 className="font-medium text-lg mb-2">Select a draft</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Choose a draft from the list to view its details, edit the AI-generated reply, and approve or reject it.
      </p>
    </div>
  );
};
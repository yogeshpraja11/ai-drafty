import { DraftStatus } from '@/types/draft';
import { cn } from '@/lib/utils';
import { 
  Inbox, 
  Clock, 
  Sparkles, 
  Edit, 
  Send, 
  XCircle, 
  Settings,
  Bot
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useDrafts } from '@/hooks/useDrafts';

interface SidebarProps {
  selectedStatus: DraftStatus | undefined;
  onStatusChange: (status: DraftStatus | undefined) => void;
}

const filterItems: { status: DraftStatus | undefined; label: string; icon: typeof Inbox }[] = [
  { status: undefined, label: 'All Drafts', icon: Inbox },
  { status: 'pending', label: 'Pending', icon: Clock },
  { status: 'draft_generated', label: 'Generated', icon: Sparkles },
  { status: 'draft_edited', label: 'Edited', icon: Edit },
  { status: 'sent', label: 'Sent', icon: Send },
  { status: 'rejected', label: 'Rejected', icon: XCircle },
];

export const Sidebar: React.FC<SidebarProps> = ({ selectedStatus, onStatusChange }) => {
  const location = useLocation();
  const { data: allDrafts } = useDrafts();

  const getCount = (status: DraftStatus | undefined) => {
    if (!allDrafts) return 0;
    if (!status) return allDrafts.length;
    return allDrafts.filter(d => d.status === status).length;
  };

  return (
    <aside className="w-64 border-r border-border bg-sidebar h-screen flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[hsl(var(--draftly-ai))]">
            <Bot className="h-5 w-5 text-[hsl(var(--draftly-ai-foreground))]" />
          </div>
          <div>
            <h1 className="font-semibold text-lg text-sidebar-foreground">Draftly</h1>
            <p className="text-xs text-muted-foreground">AI Reply Agent</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {filterItems.map((item) => {
          const Icon = item.icon;
          const count = getCount(item.status);
          const isActive = selectedStatus === item.status && location.pathname === '/';

          return (
            <button
              key={item.label}
              onClick={() => onStatusChange(item.status)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-full text-sm transition-colors',
                isActive
                  ? 'bg-sidebar-primary/10 text-sidebar-primary font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1 text-left">{item.label}</span>
              {count > 0 && (
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'bg-muted'
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Settings Link */}
      <div className="p-2 border-t border-sidebar-border">
        <Link
          to="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-full text-sm transition-colors',
            location.pathname === '/settings'
              ? 'bg-sidebar-primary/10 text-sidebar-primary font-medium'
              : 'text-sidebar-foreground hover:bg-sidebar-accent'
          )}
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
};
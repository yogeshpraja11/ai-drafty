import { useState, useMemo } from 'react';
import { DraftStatus, Draft } from '@/types/draft';
import { Sidebar } from '@/components/draftly/Sidebar';
import { DraftListItem } from '@/components/draftly/DraftListItem';
import { DraftDetail } from '@/components/draftly/DraftDetail';
import { EmptyState } from '@/components/draftly/EmptyState';
import { SearchBar } from '@/components/draftly/SearchBar';
import { ConnectionStatus } from '@/components/draftly/ConnectionStatus';
import { useDrafts, useDraft, useApproveDraft, useRejectDraft } from '@/hooks/useDrafts';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useQueryClient } from '@tanstack/react-query';

const filterLabels: Record<string, string> = {
  pending: 'Pending',
  draft_generated: 'Generated',
  draft_edited: 'Edited',
  sent: 'Sent',
  rejected: 'Rejected',
};

export default function Inbox() {
  const [selectedStatus, setSelectedStatus] = useState<DraftStatus | undefined>();
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const queryClient = useQueryClient();
  const { data: drafts, isLoading, isRefetching } = useDrafts(selectedStatus);
  const { data: selectedDraft } = useDraft(selectedDraftId || '');
  const approveMutation = useApproveDraft();
  const rejectMutation = useRejectDraft();

  const filteredDrafts = useMemo(() => {
    if (!drafts) return [];
    if (!searchQuery.trim()) return drafts;

    const query = searchQuery.toLowerCase();
    return drafts.filter(
      (d) =>
        d.originalEmail.subject.toLowerCase().includes(query) ||
        d.originalEmail.from.toLowerCase().includes(query) ||
        d.draftText.toLowerCase().includes(query)
    );
  }, [drafts, searchQuery]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['drafts'] });
  };

  const handleStatusChange = (status: DraftStatus | undefined) => {
    setSelectedStatus(status);
    setSidebarOpen(false);
  };

  const SidebarComponent = (
    <Sidebar selectedStatus={selectedStatus} onStatusChange={handleStatusChange} />
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        {SidebarComponent}
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          {SidebarComponent}
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row min-w-0">
        {/* Draft List */}
        <div className="w-full lg:flex-1 border-r border-border flex flex-col min-w-[350px]">
          {/* Header */}
          <div className="p-4 border-b border-border space-y-3">
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              </Sheet>
              <h2 className="font-semibold text-lg flex-1">
                {selectedStatus ? filterLabels[selectedStatus] : 'All Drafts'}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefetching}
              >
                <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
              </Button>
              <ConnectionStatus />
            </div>
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>

          {/* Draft List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredDrafts.length === 0 ? (
              <EmptyState
                type="no-drafts"
                filterLabel={selectedStatus ? filterLabels[selectedStatus] : undefined}
              />
            ) : (
              filteredDrafts.map((draft) => (
                <DraftListItem
                  key={draft.id}
                  draft={draft}
                  isSelected={draft.id === selectedDraftId}
                  onClick={() => setSelectedDraftId(draft.id)}
                  onQuickApprove={() => approveMutation.mutate({ id: draft.id })}
                  onQuickReject={() => rejectMutation.mutate(draft.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Draft Detail */}
        <div className="flex-1 hidden lg:flex flex-col min-w-0 bg-muted/10">
          {selectedDraft ? (
            <DraftDetail draft={selectedDraft} onBack={() => setSelectedDraftId(null)} />
          ) : (
            <EmptyState type="no-selection" />
          )}
        </div>

        {/* Mobile Draft Detail */}
        {selectedDraftId && (
          <Sheet open={!!selectedDraftId} onOpenChange={() => setSelectedDraftId(null)}>
            <SheetContent side="right" className="p-0 w-full sm:max-w-lg">
              <SheetHeader className="sr-only">
                <SheetTitle>Draft Details</SheetTitle>
                <SheetDescription>View and edit the selected draft</SheetDescription>
              </SheetHeader>
              <DraftDetail
                draft={drafts?.find(d => d.id === selectedDraftId)!}
                onBack={() => setSelectedDraftId(null)}
              />
            </SheetContent>
          </Sheet>
        )}
      </div>
    </div>
  );
}
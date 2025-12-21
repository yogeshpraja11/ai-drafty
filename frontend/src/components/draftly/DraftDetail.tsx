import { useState, useEffect } from 'react';
import { Draft, ToneType } from '@/types/draft';
import { StatusBadge } from './StatusBadge';
import { ToneSelector } from './ToneSelector';
import { HistoryTimeline } from './HistoryTimeline';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Send,
  X,
  Save,
  Mail,
  Clock,
  Sparkles,
  ChevronLeft,
  History
} from 'lucide-react';
import { useEditDraft, useApproveDraft, useRejectDraft, useGenerateDraft } from '@/hooks/useDrafts';

interface DraftDetailProps {
  draft: Draft;
  onBack: () => void;
}

export const DraftDetail: React.FC<DraftDetailProps> = ({ draft, onBack }) => {
  const [editedText, setEditedText] = useState(draft.draftText);
  const [selectedTone, setSelectedTone] = useState<ToneType>(draft.tone);
  const [hasChanges, setHasChanges] = useState(false);

  const editMutation = useEditDraft();
  const approveMutation = useApproveDraft();
  const rejectMutation = useRejectDraft();
  const generateMutation = useGenerateDraft();

  useEffect(() => {
    setEditedText(draft.draftText);
    setSelectedTone(draft.tone);
    setHasChanges(false);
  }, [draft]);

  useEffect(() => {
    setHasChanges(editedText !== draft.draftText || selectedTone !== draft.tone);
  }, [editedText, selectedTone, draft]);

  const handleSave = () => {
    editMutation.mutate({ id: draft.id, text: editedText, tone: selectedTone });
  };

  const handleApprove = () => {
    // If there are unsaved changes, send the edited text
    const draftTextToSend = hasChanges ? editedText : undefined;
    approveMutation.mutate({ id: draft.id, draftText: draftTextToSend });
  };

  const handleReject = () => {
    rejectMutation.mutate(draft.id);
  };

  const isDisabled = draft.status === 'sent' || draft.status === 'rejected';
  const wordCount = editedText.trim().split(/\s+/).filter(Boolean).length;
  const charCount = editedText.length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onBack} className="lg:hidden">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="font-semibold text-lg truncate">{draft.originalEmail.subject}</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{draft.originalEmail.from}</span>
            <span>•</span>
            <span>{format(new Date(draft.originalEmail.timestamp), 'MMM d, yyyy h:mm a')}</span>
          </div>
        </div>
        <StatusBadge status={draft.status} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Original Email */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4" />
              Original Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <div className="flex gap-2">
                <span className="text-muted-foreground">From:</span>
                <span>{draft.originalEmail.from}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">To:</span>
                <span>{draft.originalEmail.to}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">Subject:</span>
                <span className="font-medium">{draft.originalEmail.subject}</span>
              </div>
              <Separator className="my-3" />
              <div className="whitespace-pre-wrap text-foreground">{draft.originalEmail.body}</div>
            </div>
          </CardContent>
        </Card>

        {/* AI Draft */}
        <Card className="border-[hsl(var(--draftly-ai))]/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-[hsl(var(--draftly-ai))]" />
                AI-Generated Reply
              </CardTitle>
              <ToneSelector value={selectedTone} onChange={setSelectedTone} disabled={isDisabled} />
            </div>
          </CardHeader>
          <CardContent>
            {(!draft.draftText && draft.status === 'pending') ? (
              <div className="min-h-[200px] flex flex-col items-center justify-center gap-4 bg-muted/20 rounded-md border border-dashed">
                <div className="text-muted-foreground text-sm text-center max-w-[200px]">
                  No draft generated for this email yet.
                </div>
                <Button
                  onClick={() => generateMutation.mutate({ id: draft.id, tone: selectedTone })}
                  disabled={generateMutation.isPending}
                  className="bg-[hsl(var(--draftly-ai))] hover:bg-[hsl(var(--draftly-ai))]/90"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Draft
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <>
                <Textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  disabled={isDisabled}
                  className="min-h-[200px] resize-none"
                  placeholder="AI-generated draft will appear here..."
                />
                <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                  <span>{wordCount} words • {charCount} characters</span>
                  {hasChanges && <span className="text-[hsl(var(--status-edited))]">Unsaved changes</span>}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4" />
              History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HistoryTimeline history={draft.history} />
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      {!isDisabled && (
        <div className="flex items-center justify-between gap-3 p-4 border-t border-border bg-card">
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={rejectMutation.isPending}
          >
            <X className="h-4 w-4 mr-2" />
            Reject
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={!hasChanges || editMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <Button
              onClick={handleApprove}
              disabled={approveMutation.isPending}
              className="bg-[hsl(var(--status-sent))] hover:bg-[hsl(var(--status-sent))]/90"
            >
              <Send className="h-4 w-4 mr-2" />
              Approve & Send
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
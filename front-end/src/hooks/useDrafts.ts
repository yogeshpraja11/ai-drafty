import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { DraftStatus, ToneType } from '@/types/draft';
import { useSettings } from '@/contexts/SettingsContext';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useDrafts = (status?: DraftStatus) => {
  const { settings, setIsConnected } = useSettings();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['drafts', status],
    queryFn: () => api.getDrafts(status),
    refetchInterval: settings.pollInterval,
    retry: 2,
  });

  useEffect(() => {
    setIsConnected(!query.isError && !query.isPending);
  }, [query.isError, query.isPending, setIsConnected]);

  return query;
};

export const useDraft = (id: string) => {
  return useQuery({
    queryKey: ['draft', id],
    queryFn: () => api.getDraft(id),
    enabled: !!id,
  });
};

export const useEditDraft = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, text, tone }: { id: string; text: string; tone: ToneType }) =>
      api.editDraft(id, text, tone),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      queryClient.setQueryData(['draft', data.id], data);
      toast({ title: 'Draft saved', description: 'Your changes have been saved.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useApproveDraft = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, draftText }: { id: string; draftText?: string }) =>
      api.approveDraft(id, draftText),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      queryClient.setQueryData(['draft', data.id], data);
      toast({ title: 'Email sent!', description: 'The reply has been sent successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to send', description: error.message, variant: 'destructive' });
    },
  });
};

export const useRejectDraft = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => api.rejectDraft(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      queryClient.setQueryData(['draft', data.id], data);
      toast({ title: 'Draft rejected', description: 'The draft has been marked as rejected.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useGenerateDraft = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, tone }: { id: string; tone: ToneType }) =>
      api.generateDraft(id, tone),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      queryClient.setQueryData(['draft', data.id], data);
      toast({ title: 'Draft generated', description: 'AI has generated a reply.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useConnectionTest = () => {
  const { setIsConnected } = useSettings();

  return useMutation({
    mutationFn: api.testConnection,
    onSuccess: (connected) => {
      setIsConnected(connected);
    },
  });
};
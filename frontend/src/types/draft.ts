export type DraftStatus = 'pending' | 'draft_generated' | 'draft_edited' | 'sent' | 'rejected';

export type ToneType = 'formal' | 'friendly' | 'concise' | 'professional';

export interface OriginalEmail {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
  threadId?: string;
}

export interface HistoryEntry {
  id: string;
  action: 'created' | 'edited' | 'approved' | 'rejected' | 'sent';
  timestamp: string;
  details?: string;
  previousText?: string;
  newText?: string;
  tone?: ToneType;
}

export interface Draft {
  id: string;
  originalEmail: OriginalEmail;
  draftText: string;
  tone: ToneType;
  status: DraftStatus;
  createdAt: string;
  updatedAt: string;
  history: HistoryEntry[];
}

export interface DraftFilters {
  status?: DraftStatus;
  search?: string;
}

export interface ApiSettings {
  baseUrl: string;
  pollInterval: number;
}

export interface AppSettings extends ApiSettings {
  defaultTone: ToneType;
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  signature?: string;
}
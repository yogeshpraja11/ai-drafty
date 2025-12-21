import { Draft, DraftStatus, ToneType } from '@/types/draft';

const getBaseUrl = (): string => {
  return localStorage.getItem('draftly_api_url') || 'http://localhost:3000';
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP error ${response.status}`);
  }
  return response.json();
};

export const api = {
  // Get all drafts with optional status filter
  getDrafts: async (status?: DraftStatus): Promise<Draft[]> => {
    const url = new URL(`${getBaseUrl()}/api/drafts`);
    if (status) {
      url.searchParams.set('status', status);
    }
    const response = await fetch(url.toString());
    return handleResponse<Draft[]>(response);
  },

  // Get a single draft by ID
  getDraft: async (id: string): Promise<Draft> => {
    const response = await fetch(`${getBaseUrl()}/api/drafts/${id}`);
    return handleResponse<Draft>(response);
  },

  // Generate AI draft for a pending email
  generateDraft: async (id: string, tone: ToneType): Promise<Draft> => {
    const response = await fetch(`${getBaseUrl()}/api/drafts/${id}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tone }),
    });
    return handleResponse<Draft>(response);
  },

  // Edit a draft's text and/or tone
  editDraft: async (id: string, text: string, tone: ToneType): Promise<Draft> => {
    const response = await fetch(`${getBaseUrl()}/api/drafts/${id}/edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, tone }),
    });
    return handleResponse<Draft>(response);
  },

  // Approve and send a draft
  approveDraft: async (id: string, draftText?: string): Promise<Draft> => {
    const response = await fetch(`${getBaseUrl()}/api/drafts/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draftText }),
    });
    return handleResponse<Draft>(response);
  },

  // Reject a draft
  rejectDraft: async (id: string): Promise<Draft> => {
    const response = await fetch(`${getBaseUrl()}/api/drafts/${id}/reject`, {
      method: 'POST',
    });
    return handleResponse<Draft>(response);
  },

  // Test connection to the API
  testConnection: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/drafts`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};
import { Draft, DraftStatus, ToneType } from '@/types/draft';

const getBaseUrl = (): string => {
  return localStorage.getItem('draftly_api_url') || 'http://localhost:3000';
};

const getHeaders = (): HeadersInit => {
  const userStr = localStorage.getItem('user');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.id) {
        headers['x-user-id'] = user.id;
      }
    } catch {
      // ignore invalid user json
    }
  }
  return headers;
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (response.status === 401) {
    // Redirect to login if unauthorized
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
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
    const response = await fetch(url.toString(), {
      headers: getHeaders()
    });
    return handleResponse<Draft[]>(response);
  },

  // Get a single draft by ID
  getDraft: async (id: string): Promise<Draft> => {
    const response = await fetch(`${getBaseUrl()}/api/drafts/${id}`, {
      headers: getHeaders()
    });
    return handleResponse<Draft>(response);
  },

  // Generate AI draft for a pending email
  generateDraft: async (id: string, tone: ToneType): Promise<Draft> => {
    const response = await fetch(`${getBaseUrl()}/api/drafts/${id}/generate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ tone }),
    });
    return handleResponse<Draft>(response);
  },

  // Edit a draft's text and/or tone
  editDraft: async (id: string, text: string, tone: ToneType): Promise<Draft> => {
    const response = await fetch(`${getBaseUrl()}/api/drafts/${id}/edit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ text, tone }),
    });
    return handleResponse<Draft>(response);
  },

  // Approve and send a draft
  approveDraft: async (id: string, draftText?: string): Promise<Draft> => {
    const response = await fetch(`${getBaseUrl()}/api/drafts/${id}/approve`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ draftText }),
    });
    return handleResponse<Draft>(response);
  },

  // Reject a draft
  rejectDraft: async (id: string): Promise<Draft> => {
    const response = await fetch(`${getBaseUrl()}/api/drafts/${id}/reject`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse<Draft>(response);
  },

  // Test connection to the API
  testConnection: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/drafts`, {
        method: 'GET',
        headers: getHeaders(),
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};
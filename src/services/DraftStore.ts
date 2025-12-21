import fs from 'fs';
import path from 'path';
import { Email } from '../types/email';
import { logger } from '../utils/logger';

export type DraftStatus =
  | 'pending'
  | 'draft_generated'
  | 'draft_edited'
  | 'approved'
  | 'rejected'
  | 'sent';

export type DraftTone = 'formal' | 'concise' | 'friendly';

export interface DraftRecord {
  id: string;
  email: Email;
  draftText: string;
  tone: DraftTone;
  status: DraftStatus;
  createdAt: string;
  updatedAt: string;
  history: Array<{
    at: string;
    action: string;
    details?: any;
  }>;
}

interface DraftStoreState {
  drafts: DraftRecord[];
}

const DATA_FILE = path.join(process.cwd(), 'data', 'drafts.json');

export class DraftStore {
  private state: DraftStoreState = { drafts: [] };

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        this.state = JSON.parse(raw);
      } else {
        this.persist();
      }
    } catch (err) {
      logger.error('Failed to load draft store, starting fresh', err);
      this.state = { drafts: [] };
    }
  }

  private persist() {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.state, null, 2), 'utf8');
    } catch (err) {
      logger.error('Failed to persist draft store', err);
    }
  }

  private now() {
    return new Date().toISOString();
  }

  private addHistory(draft: DraftRecord, action: string, details?: any) {
    draft.history.push({ at: this.now(), action, details });
  }

  public addIncomingEmail(email: Email, draftText: string, tone: DraftTone = 'formal'): DraftRecord | null {
    // Check if draft already exists for this email
    const existing = this.getDraft(email.id);
    if (existing) {
      logger.info(`Draft already exists for email ${email.id} from ${email.from}`);
      return null;
    }

    const now = this.now();
    const record: DraftRecord = {
      id: email.id,
      email,
      draftText,
      tone,
      status: 'draft_generated',
      createdAt: now,
      updatedAt: now,
      history: [],
    };
    this.addHistory(record, 'email_received', { from: email.from, subject: email.subject });
    this.addHistory(record, 'draft_generated', { tone });
    this.state.drafts.unshift(record);
    this.persist();
    logger.info(`Created draft for email ${email.id} from ${email.from}`);
    return record;
  }

  public listDrafts(status?: DraftStatus): DraftRecord[] {
    if (!status) return this.state.drafts;
    return this.state.drafts.filter((d) => d.status === status);
  }

  public getDraft(id: string): DraftRecord | undefined {
    return this.state.drafts.find((d) => d.id === id);
  }

  public updateDraftText(id: string, draftText: string, tone?: DraftTone): DraftRecord | undefined {
    const draft = this.getDraft(id);
    if (!draft) return undefined;
    draft.draftText = draftText;
    if (tone) {
      draft.tone = tone;
    }
    draft.status = draft.status === 'draft_generated' ? 'draft_edited' : draft.status;
    draft.updatedAt = this.now();
    this.addHistory(draft, 'draft_updated', { tone: draft.tone });
    this.persist();
    return draft;
  }

  public updateStatus(id: string, status: DraftStatus, details?: any): DraftRecord | undefined {
    const draft = this.getDraft(id);
    if (!draft) return undefined;
    draft.status = status;
    draft.updatedAt = this.now();
    this.addHistory(draft, `status_${status}`, details);
    this.persist();
    return draft;
  }
}



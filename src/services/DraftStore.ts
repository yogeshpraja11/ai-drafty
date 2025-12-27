import { getDb } from '../db/database';
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

export class DraftStore {

  private now() {
    return new Date().toISOString();
  }

  // Helper to map DB row to DraftRecord
  private parseRow(row: any): DraftRecord {
    return {
      id: row.id,
      email: JSON.parse(row.email_data),
      draftText: row.draft_text,
      tone: row.tone as DraftTone,
      status: row.status as DraftStatus,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      history: JSON.parse(row.history || '[]')
    };
  }

  public async addIncomingEmail(userId: string, email: Email, draftText: string, tone: DraftTone = 'formal'): Promise<DraftRecord | null> {
    const db = await getDb();
    const existing = await db.get('SELECT id FROM drafts WHERE id = ?', email.id);

    if (existing) {
      logger.info(`Draft already exists for email ${email.id}`);
      return null;
    }

    const now = this.now();
    const history = [
      { at: now, action: 'email_received', details: { from: email.from, subject: email.subject } },
      { at: now, action: 'draft_generated', details: { tone } }
    ];

    const record: DraftRecord = {
      id: email.id,
      email,
      draftText,
      tone,
      status: 'draft_generated',
      createdAt: now,
      updatedAt: now,
      history
    };

    await db.run(
      `INSERT INTO drafts (id, user_id, email_data, draft_text, status, tone, history, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      email.id,
      userId,
      JSON.stringify(email),
      draftText,
      'draft_generated',
      tone,
      JSON.stringify(history),
      now,
      now
    );

    logger.info(`Created draft for email ${email.id}`);
    return record;
  }

  public async listDrafts(userId: string, status?: DraftStatus): Promise<DraftRecord[]> {
    const db = await getDb();
    let rows;
    if (status) {
      rows = await db.all('SELECT * FROM drafts WHERE user_id = ? AND status = ? ORDER BY created_at DESC', userId, status);
    } else {
      rows = await db.all('SELECT * FROM drafts WHERE user_id = ? ORDER BY created_at DESC', userId);
    }
    return rows.map(this.parseRow);
  }

  public async getDraft(id: string): Promise<DraftRecord | undefined> {
    const db = await getDb();
    const row = await db.get('SELECT * FROM drafts WHERE id = ?', id);
    if (!row) return undefined;
    return this.parseRow(row);
  }

  public async updateDraftText(id: string, draftText: string, tone?: DraftTone): Promise<DraftRecord | undefined> {
    const db = await getDb();
    const draft = await this.getDraft(id);
    if (!draft) return undefined;

    const history = draft.history;
    history.push({ at: this.now(), action: 'draft_updated', details: { tone: tone || draft.tone } });

    await db.run(
      `UPDATE drafts SET draft_text = ?, tone = ?, status = ?, history = ?, updated_at = ? WHERE id = ?`,
      draftText,
      tone || draft.tone,
      draft.status === 'draft_generated' ? 'draft_edited' : draft.status,
      JSON.stringify(history),
      this.now(),
      id
    );

    return this.getDraft(id);
  }

  public async updateStatus(id: string, status: DraftStatus, details?: any): Promise<DraftRecord | undefined> {
    const db = await getDb();
    const draft = await this.getDraft(id);
    if (!draft) return undefined;

    const history = draft.history;
    history.push({ at: this.now(), action: `status_${status}`, details });

    await db.run(
      `UPDATE drafts SET status = ?, history = ?, updated_at = ? WHERE id = ?`,
      status,
      JSON.stringify(history),
      this.now(),
      id
    );

    return this.getDraft(id);
  }
}

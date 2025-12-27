"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DraftStore = void 0;
const database_1 = require("../db/database");
const logger_1 = require("../utils/logger");
class DraftStore {
    now() {
        return new Date().toISOString();
    }
    // Helper to map DB row to DraftRecord
    parseRow(row) {
        return {
            id: row.id,
            email: JSON.parse(row.email_data),
            draftText: row.draft_text,
            tone: row.tone,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            history: JSON.parse(row.history || '[]')
        };
    }
    async addIncomingEmail(userId, email, draftText, tone = 'formal') {
        const db = await (0, database_1.getDb)();
        const existing = await db.get('SELECT id FROM drafts WHERE id = ?', email.id);
        if (existing) {
            logger_1.logger.info(`Draft already exists for email ${email.id}`);
            return null;
        }
        const now = this.now();
        const history = [
            { at: now, action: 'email_received', details: { from: email.from, subject: email.subject } },
            { at: now, action: 'draft_generated', details: { tone } }
        ];
        const record = {
            id: email.id,
            email,
            draftText,
            tone,
            status: 'draft_generated',
            createdAt: now,
            updatedAt: now,
            history
        };
        await db.run(`INSERT INTO drafts (id, user_id, email_data, draft_text, status, tone, history, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, email.id, userId, JSON.stringify(email), draftText, 'draft_generated', tone, JSON.stringify(history), now, now);
        logger_1.logger.info(`Created draft for email ${email.id}`);
        return record;
    }
    async listDrafts(userId, status) {
        const db = await (0, database_1.getDb)();
        let rows;
        if (status) {
            rows = await db.all('SELECT * FROM drafts WHERE user_id = ? AND status = ? ORDER BY created_at DESC', userId, status);
        }
        else {
            rows = await db.all('SELECT * FROM drafts WHERE user_id = ? ORDER BY created_at DESC', userId);
        }
        return rows.map(this.parseRow);
    }
    async getDraft(id) {
        const db = await (0, database_1.getDb)();
        const row = await db.get('SELECT * FROM drafts WHERE id = ?', id);
        if (!row)
            return undefined;
        return this.parseRow(row);
    }
    async updateDraftText(id, draftText, tone) {
        const db = await (0, database_1.getDb)();
        const draft = await this.getDraft(id);
        if (!draft)
            return undefined;
        const history = draft.history;
        history.push({ at: this.now(), action: 'draft_updated', details: { tone: tone || draft.tone } });
        await db.run(`UPDATE drafts SET draft_text = ?, tone = ?, status = ?, history = ?, updated_at = ? WHERE id = ?`, draftText, tone || draft.tone, draft.status === 'draft_generated' ? 'draft_edited' : draft.status, JSON.stringify(history), this.now(), id);
        return this.getDraft(id);
    }
    async updateStatus(id, status, details) {
        const db = await (0, database_1.getDb)();
        const draft = await this.getDraft(id);
        if (!draft)
            return undefined;
        const history = draft.history;
        history.push({ at: this.now(), action: `status_${status}`, details });
        await db.run(`UPDATE drafts SET status = ?, history = ?, updated_at = ? WHERE id = ?`, status, JSON.stringify(history), this.now(), id);
        return this.getDraft(id);
    }
}
exports.DraftStore = DraftStore;

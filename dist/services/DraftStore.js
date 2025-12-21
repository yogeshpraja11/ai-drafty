"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DraftStore = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
const DATA_FILE = path_1.default.join(process.cwd(), 'data', 'drafts.json');
class DraftStore {
    state = { drafts: [] };
    constructor() {
        this.load();
    }
    load() {
        try {
            if (fs_1.default.existsSync(DATA_FILE)) {
                const raw = fs_1.default.readFileSync(DATA_FILE, 'utf8');
                this.state = JSON.parse(raw);
            }
            else {
                this.persist();
            }
        }
        catch (err) {
            logger_1.logger.error('Failed to load draft store, starting fresh', err);
            this.state = { drafts: [] };
        }
    }
    persist() {
        try {
            const dir = path_1.default.dirname(DATA_FILE);
            if (!fs_1.default.existsSync(dir)) {
                fs_1.default.mkdirSync(dir, { recursive: true });
            }
            fs_1.default.writeFileSync(DATA_FILE, JSON.stringify(this.state, null, 2), 'utf8');
        }
        catch (err) {
            logger_1.logger.error('Failed to persist draft store', err);
        }
    }
    now() {
        return new Date().toISOString();
    }
    addHistory(draft, action, details) {
        draft.history.push({ at: this.now(), action, details });
    }
    addIncomingEmail(email, draftText, tone = 'formal') {
        const now = this.now();
        const record = {
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
        return record;
    }
    listDrafts(status) {
        if (!status)
            return this.state.drafts;
        return this.state.drafts.filter((d) => d.status === status);
    }
    getDraft(id) {
        return this.state.drafts.find((d) => d.id === id);
    }
    updateDraftText(id, draftText, tone) {
        const draft = this.getDraft(id);
        if (!draft)
            return undefined;
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
    updateStatus(id, status, details) {
        const draft = this.getDraft(id);
        if (!draft)
            return undefined;
        draft.status = status;
        draft.updatedAt = this.now();
        this.addHistory(draft, `status_${status}`, details);
        this.persist();
        return draft;
    }
}
exports.DraftStore = DraftStore;

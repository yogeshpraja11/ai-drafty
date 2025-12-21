"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = createServer;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const logger_1 = require("./utils/logger");
function createServer(emailService, draftStore) {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({
        origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:8080'],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    app.use(express_1.default.json());
    // List all drafts (optionally filter by status)
    app.get('/api/drafts', (req, res) => {
        const status = req.query.status;
        const drafts = draftStore.listDrafts(status);
        res.json(drafts);
    });
    // Get single draft by id
    app.get('/api/drafts/:id', (req, res) => {
        const draft = draftStore.getDraft(req.params.id);
        if (!draft) {
            return res.status(404).json({ message: 'Draft not found' });
        }
        res.json(draft);
    });
    // Update draft text (edit)
    app.post('/api/drafts/:id/edit', (req, res) => {
        const { draftText, tone } = req.body;
        if (!draftText) {
            return res.status(400).json({ message: 'draftText is required' });
        }
        const updated = draftStore.updateDraftText(req.params.id, draftText, tone);
        if (!updated) {
            return res.status(404).json({ message: 'Draft not found' });
        }
        res.json(updated);
    });
    // Approve and send a draft
    app.post('/api/drafts/:id/approve', async (req, res) => {
        try {
            const { draftText } = req.body;
            const draft = draftStore.getDraft(req.params.id);
            if (!draft) {
                return res.status(404).json({ message: 'Draft not found' });
            }
            const finalText = draftText || draft.draftText;
            // send email using the email service
            await emailService.sendReply(draft.email, finalText);
            draftStore.updateDraftText(draft.id, finalText);
            const updated = draftStore.updateStatus(draft.id, 'sent', { via: 'api_approve' });
            res.json(updated);
        }
        catch (error) {
            logger_1.logger.error('Failed to approve/send draft', error);
            res.status(500).json({ message: 'Failed to send draft', error: error?.message });
        }
    });
    // Reject a draft (no send)
    app.post('/api/drafts/:id/reject', (req, res) => {
        const draft = draftStore.updateStatus(req.params.id, 'rejected');
        if (!draft) {
            return res.status(404).json({ message: 'Draft not found' });
        }
        res.json(draft);
    });
    return app;
}

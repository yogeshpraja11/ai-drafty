"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = createServer;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const AIResponseHandler_1 = require("./handlers/AIResponseHandler");
const AuthHandler_1 = require("./handlers/AuthHandler");
const logger_1 = require("./utils/logger");
const SettingsStore_1 = require("./services/SettingsStore");
function createServer(emailService, draftStore) {
    const app = (0, express_1.default)();
    const aiHandler = new AIResponseHandler_1.AIResponseHandler(emailService);
    const authHandler = new AuthHandler_1.AuthHandler();
    app.use((0, cors_1.default)({
        origin: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://localhost:8080",
            "http://127.0.0.1:8080",
            "http://192.168.1.2:8080",
        ],
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }));
    app.use(express_1.default.json());
    // Helper to transform draft for frontend
    const toFrontendDraft = (draft) => {
        if (!draft)
            return null;
        return {
            ...draft,
            originalEmail: {
                ...draft.email,
                // Map backend 'date' to frontend 'timestamp'
                timestamp: draft.email.date || draft.email.timestamp || new Date().toISOString()
            },
            // Map history items
            history: (draft.history || []).map((h, index) => ({
                ...h,
                id: h.id || `hist-${index}`,
                timestamp: h.timestamp || h.at || new Date().toISOString()
            }))
        };
    };
    // Test endpoint to manually trigger email fetch
    app.post("/api/test-fetch", async (req, res) => {
        try {
            logger_1.logger.info("Manual email fetch triggered");
            // Trigger a manual email fetch by emitting the event
            const emails = await emailService.fetchEmails();
            emails.forEach((email) => emailService.emit("email:received", email));
            res.json({
                success: true,
                message: `Fetched ${emails.length} email(s)`,
                emails: emails.length,
            });
        }
        catch (error) {
            logger_1.logger.error("Manual fetch error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch emails",
                error: error?.message,
            });
        }
    });
    // Auth Routes
    app.get("/api/auth/url", (req, res) => authHandler.getAuthUrl(req, res));
    app.post("/api/auth/callback", (req, res) => authHandler.handleCallback(req, res));
    // Settings Endpoints
    // Get current settings
    app.get("/api/settings", async (req, res) => {
        const userId = req.headers['x-user-id'];
        const settings = await SettingsStore_1.settingsStore.getSettings(userId); // Will fallback to defaults if userId is undefined/null inside, but passing it is better
        res.json(settings);
    });
    // Update settings
    app.post("/api/settings", async (req, res) => {
        try {
            const updates = req.body;
            const userId = req.headers['x-user-id'];
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized: Missing User ID" });
            }
            const updated = await SettingsStore_1.settingsStore.updateSettings(userId, updates);
            // Update config/defaults if needed, or handlers will read from store directly
            res.json(updated);
        }
        catch (error) {
            logger_1.logger.error("Failed to update settings", error);
            res.status(500).json({ message: "Failed to update settings" });
        }
    });
    // List all drafts (optionally filter by status)
    app.get("/api/drafts", async (req, res) => {
        const status = req.query.status;
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: Missing User ID" });
        }
        const drafts = await draftStore.listDrafts(userId, status);
        res.json(drafts.map(toFrontendDraft));
    });
    // Get single draft by id
    app.get("/api/drafts/:id", async (req, res) => {
        const { id } = req.params;
        const draft = await draftStore.getDraft(id);
        if (!draft) {
            return res.status(404).json({ message: "Draft not found" });
        }
        res.json(toFrontendDraft(draft));
    });
    // Generate draft for a pending email
    app.post("/api/drafts/:id/generate", async (req, res) => {
        try {
            const { id } = req.params;
            const { tone } = req.body;
            const draft = await draftStore.getDraft(id);
            if (!draft) {
                return res.status(404).json({ message: "Draft not found" });
            }
            logger_1.logger.info(`Generating draft for ${id} with tone ${tone || 'formal'}`);
            // Generate AI response
            const response = await aiHandler.generateResponse(draft.email, tone || 'formal');
            // Update draft text and status
            const updated = await draftStore.updateDraftText(id, response, tone);
            if (updated) {
                // Also ensure status is set to draft_generated if it was pending
                if (updated.status === 'pending') {
                    const statusUpdated = await draftStore.updateStatus(id, 'draft_generated');
                    if (statusUpdated)
                        updated.status = 'draft_generated';
                }
            }
            res.json(toFrontendDraft(updated));
        }
        catch (error) {
            logger_1.logger.error("Failed to generate draft:", error);
            res.status(500).json({
                message: "Failed to generate draft",
                error: error?.message
            });
        }
    });
    // Update draft text (edit)
    app.post("/api/drafts/:id/edit", async (req, res) => {
        const { draftText, tone } = req.body;
        if (!draftText) {
            return res.status(400).json({ message: "draftText is required" });
        }
        const { id } = req.params;
        const updated = await draftStore.updateDraftText(id, draftText, tone);
        if (!updated) {
            return res.status(404).json({ message: "Draft not found" });
        }
        res.json(toFrontendDraft(updated));
    });
    // Approve and send a draft
    app.post("/api/drafts/:id/approve", async (req, res) => {
        try {
            const { draftText } = req.body;
            const { id } = req.params;
            const draft = await draftStore.getDraft(id);
            if (!draft) {
                return res.status(404).json({ message: "Draft not found" });
            }
            const finalText = draftText || draft.draftText;
            // send email using the email service
            await emailService.sendReply(draft.email, finalText);
            await draftStore.updateDraftText(id, finalText);
            const updated = await draftStore.updateStatus(id, "sent", {
                via: "api_approve",
            });
            res.json(toFrontendDraft(updated));
        }
        catch (error) {
            logger_1.logger.error("Failed to approve/send draft", error);
            res.status(500).json({
                message: "Failed to send draft",
                error: error?.message,
            });
        }
    });
    // Reject a draft (no send)
    app.post("/api/drafts/:id/reject", async (req, res) => {
        const { id } = req.params;
        const draft = await draftStore.updateStatus(id, "rejected");
        if (!draft) {
            return res.status(404).json({ message: "Draft not found" });
        }
        res.json(toFrontendDraft(draft));
    });
    return app;
}

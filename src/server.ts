import express, { Request, Response } from "express";
import cors from "cors";
import { EmailService } from "./services/EmailService";
import { DraftStore } from "./services/DraftStore";
import { AIResponseHandler } from "./handlers/AIResponseHandler";
import { logger } from "./utils/logger";
import { settingsStore } from "./services/SettingsStore";

export function createServer(
  emailService: EmailService,
  draftStore: DraftStore
) {
  const app = express();
  const aiHandler = new AIResponseHandler(emailService);

  app.use(
    cors({
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
    })
  );
  app.use(express.json());

  // Helper to transform draft for frontend
  const toFrontendDraft = (draft: any) => {
    if (!draft) return null;
    return {
      ...draft,
      originalEmail: {
        ...draft.email,
        // Map backend 'date' to frontend 'timestamp'
        timestamp: draft.email.date || draft.email.timestamp || new Date().toISOString()
      },
      // Map history items
      history: (draft.history || []).map((h: any, index: number) => ({
        ...h,
        id: h.id || `hist-${index}`,
        timestamp: h.timestamp || h.at || new Date().toISOString()
      }))
    };
  };

  // Test endpoint to manually trigger email fetch
  app.post("/api/test-fetch", async (req: Request, res: Response) => {
    try {
      logger.info("Manual email fetch triggered");
      // Trigger a manual email fetch by emitting the event
      const emails = await (emailService as any).fetchEmails();
      emails.forEach((email: any) =>
        emailService.emit("email:received", email)
      );
      res.json({
        success: true,
        message: `Fetched ${emails.length} email(s)`,
        emails: emails.length,
      });
    } catch (error: any) {
      logger.error("Manual fetch error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch emails",
        error: error?.message,
      });
    }
  });

  // Settings Endpoints
  // Get current settings
  app.get("/api/settings", (req: Request, res: Response) => {
    res.json(settingsStore.getSettings());
  });

  // Update settings
  app.post("/api/settings", (req: Request, res: Response) => {
    try {
      const updates = req.body;
      const updated = settingsStore.updateSettings(updates);
      // Update config/defaults if needed, or handlers will read from store directly
      res.json(updated);
    } catch (error: any) {
      logger.error("Failed to update settings", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // List all drafts (optionally filter by status)
  app.get("/api/drafts", (req: Request, res: Response) => {
    const status = req.query.status as any;
    const drafts = draftStore.listDrafts(status);
    res.json(drafts.map(toFrontendDraft));
  });

  // Get single draft by id
  app.get("/api/drafts/:id", (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    const draft = draftStore.getDraft(id);
    if (!draft) {
      return res.status(404).json({ message: "Draft not found" });
    }
    res.json(toFrontendDraft(draft));
  });

  // Generate draft for a pending email
  app.post("/api/drafts/:id/generate", async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params;
      const { tone } = req.body as { tone?: any };
      const draft = draftStore.getDraft(id);

      if (!draft) {
        return res.status(404).json({ message: "Draft not found" });
      }

      logger.info(`Generating draft for ${id} with tone ${tone || 'formal'}`);

      // Generate AI response
      const response = await aiHandler.generateResponse(draft.email, tone || 'formal');

      // Update draft text and status
      const updated = draftStore.updateDraftText(id, response, tone);
      if (updated) {
        // Also ensure status is set to draft_generated if it was pending
        if (updated.status === 'pending') {
          draftStore.updateStatus(id, 'draft_generated');
          updated.status = 'draft_generated';
        }
      }

      res.json(toFrontendDraft(updated));
    } catch (error: any) {
      logger.error("Failed to generate draft:", error);
      res.status(500).json({
        message: "Failed to generate draft",
        error: error?.message
      });
    }
  });

  // Update draft text (edit)
  app.post(
    "/api/drafts/:id/edit",
    (req: Request<{ id: string }>, res: Response) => {
      const { draftText, tone } = req.body as { draftText: string; tone?: any };
      if (!draftText) {
        return res.status(400).json({ message: "draftText is required" });
      }
      const { id } = req.params;
      const updated = draftStore.updateDraftText(id, draftText, tone);
      if (!updated) {
        return res.status(404).json({ message: "Draft not found" });
      }
      res.json(toFrontendDraft(updated));
    }
  );

  // Approve and send a draft
  app.post(
    "/api/drafts/:id/approve",
    async (req: Request<{ id: string }>, res: Response) => {
      try {
        const { draftText } = req.body as { draftText?: string };
        const { id } = req.params;
        const draft = draftStore.getDraft(id);
        if (!draft) {
          return res.status(404).json({ message: "Draft not found" });
        }

        const finalText = draftText || draft.draftText;

        // send email using the email service
        await emailService.sendReply(draft.email, finalText);

        draftStore.updateDraftText(id, finalText);
        const updated = draftStore.updateStatus(id, "sent", {
          via: "api_approve",
        });

        res.json(toFrontendDraft(updated));
      } catch (error: any) {
        logger.error("Failed to approve/send draft", error);
        res.status(500).json({
          message: "Failed to send draft",
          error: (error as Error)?.message,
        });
      }
    }
  );

  // Reject a draft (no send)
  app.post(
    "/api/drafts/:id/reject",
    (req: Request<{ id: string }>, res: Response) => {
      const { id } = req.params;
      const draft = draftStore.updateStatus(id, "rejected");
      if (!draft) {
        return res.status(404).json({ message: "Draft not found" });
      }
      res.json(toFrontendDraft(draft));
    }
  );

  return app;
}

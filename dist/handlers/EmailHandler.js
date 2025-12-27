"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailHandler = void 0;
const SpamHandler_1 = require("./SpamHandler");
const AIResponseHandler_1 = require("./AIResponseHandler");
const logger_1 = require("../utils/logger");
const DraftStore_1 = require("../services/DraftStore");
class EmailHandler {
    emailService;
    spamHandler;
    draftStore;
    aiHandler;
    constructor(emailService, spamHandler = new SpamHandler_1.SpamHandler(), aiHandler, draftStore = new DraftStore_1.DraftStore()) {
        this.emailService = emailService;
        this.spamHandler = spamHandler;
        this.draftStore = draftStore;
        this.aiHandler = aiHandler || new AIResponseHandler_1.AIResponseHandler(emailService);
        this.registerListeners();
    }
    registerListeners() {
        this.emailService.on('email:received', async (email) => {
            try {
                const isSpam = await this.spamHandler.isSpam(email);
                if (isSpam) {
                    logger_1.logger.info(`Marked email as spam from ${email.from}`);
                    return;
                }
                // Store the email as pending, without generating a draft yet
                // We pass empty string as draftText and 'pending' as status (though addIncomingEmail might default to 'draft_generated', we need to check DraftStore or just pass what we can)
                // Trying to use addIncomingEmail with empty text.
                // Assuming email.userId is present as per new Email type
                const draft = await this.draftStore.addIncomingEmail(email.userId, email, '', 'formal'); // Empty draft text
                if (draft) {
                    // We need to manually set status to pending if addIncomingEmail doesn't support it, 
                    // OR we assume empty text implies pending.
                    // Let's look at DraftStore.ts again. It sets status to 'draft_generated' by default.
                    await this.draftStore.updateStatus(draft.id, 'pending');
                    logger_1.logger.info(`Saved email from ${email.from} as pending (Subject: ${email.subject})`);
                }
                else {
                    logger_1.logger.info(`Skipped creating draft - already exists for email from ${email.from}`);
                }
            }
            catch (error) {
                logger_1.logger.error('Error processing email:', error);
            }
        });
    }
}
exports.EmailHandler = EmailHandler;

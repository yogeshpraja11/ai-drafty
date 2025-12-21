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
    aiHandler;
    draftStore;
    constructor(emailService, spamHandler = new SpamHandler_1.SpamHandler(), aiHandler = new AIResponseHandler_1.AIResponseHandler(), draftStore = new DraftStore_1.DraftStore()) {
        this.emailService = emailService;
        this.spamHandler = spamHandler;
        this.aiHandler = aiHandler;
        this.draftStore = draftStore;
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
                // Generate an AI draft and store it for review instead of sending immediately
                const response = await this.aiHandler.generateResponse(email, 'formal');
                this.draftStore.addIncomingEmail(email, response, 'formal');
                logger_1.logger.info(`Draft generated for email from ${email.from}`);
            }
            catch (error) {
                logger_1.logger.error('Error processing email:', error);
            }
        });
    }
}
exports.EmailHandler = EmailHandler;

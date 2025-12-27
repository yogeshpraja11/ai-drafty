import { EmailService } from '../services/EmailService';
import { SpamHandler } from './SpamHandler';
import { AIResponseHandler } from './AIResponseHandler';
import { logger } from '../utils/logger';
import { DraftStore } from '../services/DraftStore';

export class EmailHandler {
  private aiHandler: AIResponseHandler;

  constructor(
    private emailService: EmailService,
    private spamHandler = new SpamHandler(),
    aiHandler?: AIResponseHandler,
    private draftStore = new DraftStore()
  ) {
    this.aiHandler = aiHandler || new AIResponseHandler(emailService);
    this.registerListeners();
  }

  private registerListeners(): void {
    this.emailService.on('email:received', async (email) => {
      try {
        const isSpam = await this.spamHandler.isSpam(email);

        if (isSpam) {
          logger.info(`Marked email as spam from ${email.from}`);
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
          logger.info(`Saved email from ${email.from} as pending (Subject: ${email.subject})`);
        } else {
          logger.info(`Skipped creating draft - already exists for email from ${email.from}`);
        }
      } catch (error) {
        logger.error('Error processing email:', error);
      }
    });
  }
}
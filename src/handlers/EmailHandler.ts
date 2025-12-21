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
        // Let's modify behavior: we just add it to store. The store's addIncomingEmail might need adjustment if it hardcodes 'draft_generated'.
        // For now, let's assume we can pass 'pending' logic or update store later. 
        // Trying to use addIncomingEmail with empty text.
        const draft = this.draftStore.addIncomingEmail(email, '', 'formal'); // Empty draft text

        if (draft) {
          // We need to manually set status to pending if addIncomingEmail doesn't support it, 
          // OR we assume empty text implies pending.
          // Let's look at DraftStore.ts again. It sets status to 'draft_generated' by default.
          // We should probably update the status immediately after or modify DraftStore.
          // Since I can't modify DraftStore in this tool call (single file restriction), I'll update it via `updateStatus` if needed, 
          // OR simpler: just let it be 'draft_generated' with empty text for now, but better to be 'pending'.
          // Actually, I should check DraftStore in next step, but here I will just pass empty text.
          // Better yet, I'll update the status to 'pending' right here if I can accessing the store public method.
          this.draftStore.updateStatus(draft.id, 'pending');
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
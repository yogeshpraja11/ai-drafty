import { Email } from '../types/email';
import { DraftTone } from '../services/DraftStore';
import { GroqService } from '../services/GroqService';
import { EmailService } from '../services/EmailService';
import { settingsStore } from '../services/SettingsStore';

export class AIResponseHandler {
  private groqService = new GroqService();
  private emailService: EmailService;

  constructor(emailService: EmailService) {
    this.emailService = emailService;
  }

  async generateResponse(email: Email, tone: DraftTone = 'formal'): Promise<string> {
    // Fetch dependencies
    const settings = settingsStore.getSettings();
    const signature = settings.signature || '';

    // Fetch recent sent emails for style analysis
    const sentEmails = await this.emailService.fetchLastSentEmails(5);

    const prompt = this.createPrompt(email, tone, signature, sentEmails);
    return this.groqService.generateEmailResponse(prompt);
  }

  private createPrompt(email: Email, tone: DraftTone, signature: string, styleExamples: string[]): string {
    const styleSection = styleExamples.length > 0
      ? `
      STYLE ANALYSIS (MIMIC THIS STYLE):
      Here are recent emails sent by the user. Analyze their tone, greeting style, sentence length, and common phrases. Try to mimic this style in your response.
      ${styleExamples.map((ex, i) => `--- SAMPLE ${i + 1} ---\n${ex}\n`).join('')}
      `
      : '';

    return `
      You are a professional email assistant. Your task is to draft a reply to the following email.
      
      Original Email:
      From: ${email.from}
      Subject: ${email.subject}
      Content: ${email.text}

      ${styleSection}

      Instructions:
      1. Tone: ${tone}. Use language appropriate for this tone, while respecting the user's style if samples are provided.
      2. Context: Reply directly to the content of the email.
      3. Length: Keep it concise and relevant.
      4. Signature: Use the following signature exactly: "${signature}". Do not add any other placeholder.
      5. If the email is a notification or spam that doesn't require a reply, generate a brief acknowledgement or state that no reply is needed.

      Draft the reply body only.
    `;
  }
}
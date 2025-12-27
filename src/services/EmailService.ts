import { EventEmitter } from 'events';
import { google } from 'googleapis';
import { simpleParser } from 'mailparser';
import { Email } from '../types/email';
import { logger } from '../utils/logger';
import { config } from '../config';
import { userService } from './UserService';
import { googleAuthService } from './GoogleAuthService';
import { User } from './UserService';

export class EmailService extends EventEmitter {
  private startTime: Date;

  constructor() {
    super();
    this.startTime = new Date();
    this.setupPolling();
  }

  private setupPolling(): void {
    setInterval(async () => {
      try {
        const users = await userService.getAllUsers();
        for (const user of users as User[]) {
          await this.processUserEmails(user);
        }
      } catch (error) {
        logger.error('Email polling failed:', error);
      }
    }, config.email.pollInterval);
  }

  private async processUserEmails(user: User) {
    if (!user.access_token || !user.refresh_token) return;

    try {
      const auth = googleAuthService.createClient(user.access_token, user.refresh_token);
      const gmail = google.gmail({ version: 'v1', auth });

      // List unread messages
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread',
        maxResults: 10 // Limit to avoid overwhelming
      });

      const messages = response.data.messages || [];

      for (const msg of messages) {
        if (!msg.id) continue;

        // Fetch full message
        const fullMsg = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'raw' // simpler to use simpleParser on raw
        });

        if (!fullMsg.data.raw) continue;

        // Decode raw message (base64url)
        const decodedRaw = Buffer.from(fullMsg.data.raw, 'base64').toString();
        const parsed = await simpleParser(decodedRaw);

        // Check if we should process (e.g. date)
        // If we want to avoid re-processing, we might need to check if draft/processed exists in DB.
        // But for now, relying on 'is:unread' and maybe marking as read (or not).
        // The requirements say "fetch unread", usually implies we shouldn't re-process old ones.
        // We can check if date > startTime to simulate "new sessions only" 
        // OR check if we already have it. 
        // For robustness, let's just emit. The listener (DraftStore) checks existence.

        const email: Email = {
          id: msg.id,
          userId: user.id,
          from: parsed.from?.text || 'unknown',
          to: Array.isArray(parsed.to) ? parsed.to.map(t => t.text).join(', ') : (parsed.to?.text || 'me'),
          subject: parsed.subject || 'No Subject',
          text: parsed.text || '',
          date: parsed.date || new Date()
        };

        this.emit('email:received', email);
      }

    } catch (error) {
      logger.error(`Error processing emails for user ${user.id}:`, error);
    }
  }

  public async fetchLastSentEmails(userId: string, limit: number = 5): Promise<string[]> {
    const user = await userService.getUser(userId) as User;
    if (!user || !user.access_token || !user.refresh_token) return [];

    try {
      const auth = googleAuthService.createClient(user.access_token, user.refresh_token);
      const gmail = google.gmail({ version: 'v1', auth });

      const response = await gmail.users.messages.list({
        userId: 'me',
        labelIds: ['SENT'],
        maxResults: limit
      });

      const messages = response.data.messages || [];
      const bodies: string[] = [];

      for (const msg of messages) {
        if (!msg.id) continue;
        const fullMsg = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'raw'
        });

        if (fullMsg.data.raw) {
          const decodedRaw = Buffer.from(fullMsg.data.raw, 'base64').toString();
          const parsed = await simpleParser(decodedRaw);
          // Clean text
          if (parsed.text) {
            const cleanText = parsed.text.split(/On .* wrote:|From: /i)[0].trim();
            if (cleanText) bodies.push(cleanText);
          }
        }
      }
      return bodies;
    } catch (error) {
      logger.error(`Error fetching sent emails for user ${userId}`, error);
      return [];
    }
  }

  public async sendReply(originalEmail: Email, response: string): Promise<void> {
    const userId = originalEmail.userId;
    const user = await userService.getUser(userId) as User;
    if (!user || !user.access_token || !user.refresh_token) {
      throw new Error('User authentication missing');
    }

    try {
      const auth = googleAuthService.createClient(user.access_token, user.refresh_token);
      const gmail = google.gmail({ version: 'v1', auth });

      // Create raw email
      const subject = originalEmail.subject.startsWith('Re:') ? originalEmail.subject : `Re: ${originalEmail.subject}`;

      const messageParts = [
        `From: "Me" <${user.email}>`,
        `To: ${originalEmail.from}`,
        `Subject: ${subject}`,
        `In-Reply-To: ${originalEmail.id}`,
        `References: ${originalEmail.id}`,
        `Content-Type: text/plain; charset=utf-8`,
        `MIME-Version: 1.0`,
        ``,
        response
      ];

      const rawMessage = messageParts.join('\n');
      const encodedMessage = Buffer.from(rawMessage).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
          threadId: originalEmail.id // Threading
        }
      });

      logger.info(`Replied to email ${originalEmail.id} for user ${userId}`);
    } catch (error) {
      logger.error('Failed to send reply:', error);
      throw error;
    }
  }
}
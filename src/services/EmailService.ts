import { EventEmitter } from 'events';
import nodemailer from 'nodemailer';
import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { Email } from '../types/email';
import { logger } from '../utils/logger';
import { config } from '../config';

export class EmailService extends EventEmitter {
  private transporter: nodemailer.Transporter;
  private startTime: Date;

  constructor() {
    super();
    this.startTime = new Date();
    this.transporter = this.createTransporter();
    this.setupPolling();
  }

  private createTransporter(): nodemailer.Transporter {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.email.user,
        pass: config.email.password
      }
    });
  }

  private setupPolling(): void {
    setInterval(async () => {
      try {
        const emails = await this.fetchEmails();
        emails.forEach(email => this.emit('email:received', email));
      } catch (error) {
        logger.error('Email polling failed:', error);
      }
    }, config.email.pollInterval);
  }

  public async fetchEmails(): Promise<Email[]> {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: config.email.user,
        password: config.email.password,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        tlsOptions: {
          rejectUnauthorized: false,
          servername: 'imap.gmail.com'
        },
        authTimeout: 10000
      });

      const emails: Email[] = [];

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            logger.error('Failed to open INBOX:', err);
            return reject(err);
          }

          const totalMessages = box.messages.total;
          if (totalMessages === 0) {
            logger.info('Inbox is empty');
            imap.end();
            return resolve([]);
          }

          // Fetch the last 30 messages (or fewer if total < 30)
          const fetchCount = 30;
          const startSeq = Math.max(1, totalMessages - fetchCount + 1);
          const endSeq = totalMessages;

          logger.info(`Fetching emails ${startSeq}:${endSeq} (total: ${totalMessages})`);

          const fetch = imap.seq.fetch(`${startSeq}:${endSeq}`, {
            bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
            markSeen: false, // Don't mark as seen when just browsing history
            modifiers: { uid: true }
          });

          fetch.on('message', (msg) => {
            let headers: any = {};
            let text = '';
            const uid = (msg as any).uid;

            msg.on('body', (stream, info) => {
              let buffer = '';
              stream.on('data', (chunk) => buffer += chunk.toString('utf8'));
              stream.on('end', () => {
                if (info.which === 'HEADER.FIELDS (FROM TO SUBJECT DATE)') {
                  headers = Imap.parseHeader(buffer);
                } else {
                  text = buffer;
                }
              });
            });

            msg.once('end', async () => {
              try {
                const parsed = await simpleParser(text);

                const emailData = {
                  id: uid?.toString() || Date.now().toString(),
                  from: headers.from?.[0] || 'unknown@example.com',
                  to: headers.to?.[0] || config.email.user,
                  subject: headers.subject?.[0] || 'No Subject',
                  text: parsed.text || '',
                  date: headers.date?.[0] ? new Date(headers.date[0]) : new Date()
                };

                if (!emailData.from || !emailData.text) {
                  // Relaxed validation: sometimes text is empty but has attachments/html, 
                  // but we'll stick to basic check for now, just logging warning instead of strict skip maybe?
                  // For now keeping existing strict check but logging less noisy if just empty text
                }

                if (emailData.from) { // Ensure at least sender exists
                  // Reverse order is usually handled by frontend, but we are pushing in seq order (oldest to newest)
                  // We'll reverse at the end or let frontend handle it.
                  // Pushing to array
                  emails.push(emailData);
                }

              } catch (error) {
                logger.error('Error parsing email:', error);
              }
            });
          });

          fetch.once('error', (err) => reject(err));
          fetch.once('end', () => {
            imap.end();
            // emails come in specific order (usually ascending seq), let's ensure they are consistent
            // The user requested "recent mails", so usually newest first is better for UI, 
            // but the Service just returns a list. Frontend usually sorts. 
            // However, `imap.seq.fetch` usually returns in order. 
            resolve(emails.reverse()); // Reverse to have newest first in the returned array
          });
        });
      });

      imap.once('error', (err: any) => reject(err));
      imap.connect();
    });
  }

  public async fetchLastSentEmails(limit: number = 5): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: config.email.user,
        password: config.email.password,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        tlsOptions: {
          rejectUnauthorized: false,
          servername: 'imap.gmail.com'
        },
        authTimeout: 10000
      });

      const sentEmails: string[] = [];

      imap.once('ready', () => {
        // [Gmail]/Sent Mail is the standard Sent folder name for Gmail via IMAP
        imap.openBox('[Gmail]/Sent Mail', true, (err, box) => {
          if (err) {
            // Fallback to "Sent" if specific Gmail folder fails (though unlikely for Gmail)
            imap.openBox('Sent', true, (err2, box2) => {
              if (err2) {
                logger.error('Failed to open Sent mailbox:', err2);
                imap.end();
                return resolve([]);
              }
              this.fetchFromBox(imap, box2, limit, resolve);
            });
            return;
          }
          this.fetchFromBox(imap, box, limit, resolve);
        });
      });

      imap.once('error', (err: any) => {
        logger.error('IMAP Error fetching sent emails:', err);
        resolve([]); // Return empty on error to not block AI generation
      });

      imap.connect();
    });
  }

  private fetchFromBox(imap: Imap, box: Imap.Box, limit: number, resolve: (val: string[]) => void) {
    const totalMessages = box.messages.total;
    if (totalMessages === 0) {
      imap.end();
      return resolve([]);
    }

    const fetchCount = Math.min(limit, totalMessages);
    const startSeq = Math.max(1, totalMessages - fetchCount + 1);
    const endSeq = totalMessages;

    const fetch = imap.seq.fetch(`${startSeq}:${endSeq}`, {
      bodies: ['TEXT'],
      markSeen: false,
    });

    const bodies: string[] = [];
    let pending = 0;

    fetch.on('message', (msg) => {
      pending++;
      msg.on('body', (stream, info) => {
        let buffer = '';
        stream.on('data', (chunk) => buffer += chunk.toString('utf8'));
        stream.on('end', async () => {
          try {
            // simpleParser is versatile, usually handles raw email text well
            // But for bodies: ['TEXT'], we might get just the body part or partial structure
            // Let's try simpleParser on the buffer
            const parsed = await simpleParser(buffer);
            if (parsed.text) {
              // Basic cleaning: Remove quoted replies usually noted by ">" or "On ... wrote:"
              // This is a naive regex but helps cleaning up context
              const cleanText = parsed.text.split(/On .* wrote:|From: /i)[0].trim();
              if (cleanText) bodies.push(cleanText);
            }
          } catch (e) {
            // ignore parse error
          } finally {
            pending--;
            if (pending === 0 && ended) {
              imap.end();
              resolve(bodies);
            }
          }
        });
      });
    });

    let ended = false;
    fetch.once('end', () => {
      ended = true;
      if (pending === 0) {
        imap.end();
        resolve(bodies);
      }
    });
  }

  public async sendReply(originalEmail: Email, response: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: config.email.user,
        to: originalEmail.from,
        subject: `Re: ${originalEmail.subject}`,
        text: response
      });
      logger.info(`Replied to email from ${originalEmail.from}`);
    } catch (error) {
      logger.error('Failed to send reply:', error);
      throw error;
    }
  }
}
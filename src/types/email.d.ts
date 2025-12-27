export interface Email {
  id: string;
  userId: string; // Owner/Recipient User ID
  from: string;
  to: string;
  subject: string;
  text: string;
  date: Date;
  headers?: Record<string, string>;
}
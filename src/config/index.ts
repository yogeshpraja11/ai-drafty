import dotenv from 'dotenv';

dotenv.config();

export const config = {
  email: {
    user: process.env.EMAIL_USER!,
    password: process.env.EMAIL_PASSWORD!,
    pollInterval: parseInt(process.env.EMAIL_POLL_INTERVAL || '3000')
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY!,
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
  },
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development'
  }
};
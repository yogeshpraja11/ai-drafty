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
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: process.env.GOOGLE_REDIRECT_URI!
  },
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development'
  }
};

const requiredEnvVars = [
  'EMAIL_USER',
  'EMAIL_PASSWORD',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI'
];

const missing = requiredEnvVars.filter(key => !process.env[key]);

if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}
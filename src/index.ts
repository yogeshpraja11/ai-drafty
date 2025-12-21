import { EmailService } from './services/EmailService';
import { EmailHandler } from './handlers/EmailHandler';
import { config } from './config';
import { logger } from './utils/logger';
import { DraftStore } from './services/DraftStore';
import { createServer } from './server';
import path from 'path';
import express from 'express';

function bootstrap() {
  const emailService = new EmailService();
  const draftStore = new DraftStore();
  new EmailHandler(emailService, undefined, undefined, draftStore as any);

  const app = createServer(emailService, draftStore);

  // Serve a simple frontend from /public
  const publicDir = path.join(process.cwd(), 'public');
  app.use(express.static(publicDir));

  app.listen(config.app.port, () => {
    logger.info(`HTTP server listening on port ${config.app.port}`);
  });

  logger.info(`Email agent started in ${config.app.env} mode`);
  logger.info(`Polling interval: ${config.email.pollInterval}ms`);
}

bootstrap();
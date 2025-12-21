"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const EmailService_1 = require("./services/EmailService");
const EmailHandler_1 = require("./handlers/EmailHandler");
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
const DraftStore_1 = require("./services/DraftStore");
const server_1 = require("./server");
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
function bootstrap() {
    const emailService = new EmailService_1.EmailService();
    const draftStore = new DraftStore_1.DraftStore();
    new EmailHandler_1.EmailHandler(emailService, undefined, undefined, draftStore);
    const app = (0, server_1.createServer)(emailService, draftStore);
    // Serve a simple frontend from /public
    const publicDir = path_1.default.join(process.cwd(), 'public');
    app.use(express_1.default.static(publicDir));
    app.listen(config_1.config.app.port, () => {
        logger_1.logger.info(`HTTP server listening on port ${config_1.config.app.port}`);
    });
    logger_1.logger.info(`Email agent started in ${config_1.config.app.env} mode`);
    logger_1.logger.info(`Polling interval: ${config_1.config.email.pollInterval}ms`);
}
bootstrap();

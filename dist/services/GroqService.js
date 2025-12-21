"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroqService = void 0;
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
class GroqService {
    groq;
    constructor() {
        this.groq = new groq_sdk_1.default({ apiKey: config_1.config.groq.apiKey });
    }
    async generateEmailResponse(emailContent) {
        try {
            const response = await this.groq.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional email assistant. Generate concise and appropriate responses.'
                    },
                    {
                        role: 'user',
                        content: `Respond to this email: ${emailContent}`
                    }
                ],
                model: config_1.config.groq.model
            });
            return response.choices[0]?.message?.content || '';
        }
        catch (error) {
            logger_1.logger.error('Groq API error:', error);
            throw new Error('Failed to generate AI response');
        }
    }
}
exports.GroqService = GroqService;

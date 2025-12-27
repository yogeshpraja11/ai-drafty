"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    email: {
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
        pollInterval: parseInt(process.env.EMAIL_POLL_INTERVAL || '3000')
    },
    groq: {
        apiKey: process.env.GROQ_API_KEY,
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
    },
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI
    },
    app: {
        port: parseInt(process.env.PORT || '3000', 10),
        env: process.env.NODE_ENV || 'development'
    }
};

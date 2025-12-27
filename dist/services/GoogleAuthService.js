"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleAuthService = exports.GoogleAuthService = void 0;
const googleapis_1 = require("googleapis");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
class GoogleAuthService {
    static instance;
    oauth2Client;
    constructor() {
        this.oauth2Client = new googleapis_1.google.auth.OAuth2(config_1.config.google.clientId, config_1.config.google.clientSecret, config_1.config.google.redirectUri);
    }
    static getInstance() {
        if (!GoogleAuthService.instance) {
            GoogleAuthService.instance = new GoogleAuthService();
        }
        return GoogleAuthService.instance;
    }
    getAuthUrl() {
        const scopes = [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.compose',
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
        ];
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline', // Required to get refresh_token
            scope: scopes,
            prompt: 'consent' // Force consent to ensure refresh_token is returned
        });
    }
    async getTokensFromCode(code) {
        try {
            const { tokens } = await this.oauth2Client.getToken(code);
            return tokens;
        }
        catch (error) {
            logger_1.logger.error('Error fetching tokens from code:', error);
            throw error;
        }
    }
    createClient(accessToken, refreshToken) {
        const client = new googleapis_1.google.auth.OAuth2(config_1.config.google.clientId, config_1.config.google.clientSecret, config_1.config.google.redirectUri);
        if (accessToken || refreshToken) {
            client.setCredentials({
                access_token: accessToken,
                refresh_token: refreshToken
            });
        }
        return client;
    }
}
exports.GoogleAuthService = GoogleAuthService;
exports.googleAuthService = GoogleAuthService.getInstance();

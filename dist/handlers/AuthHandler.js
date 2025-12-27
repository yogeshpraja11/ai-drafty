"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthHandler = void 0;
const GoogleAuthService_1 = require("../services/GoogleAuthService");
const UserService_1 = require("../services/UserService");
const logger_1 = require("../utils/logger");
const googleapis_1 = require("googleapis");
class AuthHandler {
    async getAuthUrl(req, res) {
        try {
            const url = GoogleAuthService_1.googleAuthService.getAuthUrl();
            res.json({ url });
        }
        catch (error) {
            logger_1.logger.error('Failed to generate auth URL', error);
            res.status(500).json({ message: 'Failed to generate auth URL' });
        }
    }
    async handleCallback(req, res) {
        try {
            const { code } = req.body;
            if (!code) {
                return res.status(400).json({ message: 'Authorization code is required' });
            }
            // 1. Exchange code for tokens
            const tokens = await GoogleAuthService_1.googleAuthService.getTokensFromCode(code);
            // 2. Get User Info
            const oauth2Client = GoogleAuthService_1.googleAuthService.createClient(tokens.access_token, tokens.refresh_token);
            const oauth2 = googleapis_1.google.oauth2({ version: 'v2', auth: oauth2Client });
            const userInfo = await oauth2.userinfo.get();
            if (!userInfo.data.email || !userInfo.data.id) {
                throw new Error('Failed to retrieve user info');
            }
            // 3. Save User to DB
            const user = await UserService_1.userService.upsertUser({
                id: userInfo.data.id,
                email: userInfo.data.email,
                name: userInfo.data.name || undefined,
                picture: userInfo.data.picture || undefined,
                access_token: tokens.access_token || undefined,
                refresh_token: tokens.refresh_token || undefined,
                token_expiry: tokens.expiry_date || undefined
            });
            // 4. Return success (and maybe a session token or just the user info for now)
            // For this MVP, we might just return the user object and ID.
            // In a real app, we'd issue a JWT. 
            res.json({
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    picture: user.picture
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Auth callback failed', error);
            res.status(500).json({ message: 'Authentication failed', error: error.message });
        }
    }
}
exports.AuthHandler = AuthHandler;

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config';
import { logger } from '../utils/logger';

export class GoogleAuthService {
    private static instance: GoogleAuthService;
    private oauth2Client: OAuth2Client;

    private constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            config.google.clientId,
            config.google.clientSecret,
            config.google.redirectUri
        );
    }

    public static getInstance(): GoogleAuthService {
        if (!GoogleAuthService.instance) {
            GoogleAuthService.instance = new GoogleAuthService();
        }
        return GoogleAuthService.instance;
    }

    public getAuthUrl(): string {
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

    public async getTokensFromCode(code: string) {
        try {
            const { tokens } = await this.oauth2Client.getToken(code);
            return tokens;
        } catch (error) {
            logger.error('Error fetching tokens from code:', error);
            throw error;
        }
    }

    public createClient(accessToken?: string, refreshToken?: string): OAuth2Client {
        const client = new google.auth.OAuth2(
            config.google.clientId,
            config.google.clientSecret,
            config.google.redirectUri
        );

        if (accessToken || refreshToken) {
            client.setCredentials({
                access_token: accessToken,
                refresh_token: refreshToken
            });
        }

        return client;
    }
}

export const googleAuthService = GoogleAuthService.getInstance();

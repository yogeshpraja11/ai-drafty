import { getDb } from '../db/database';
import { logger } from '../utils/logger';
import { userService } from './UserService';

export interface UserSettings {
    signature: string;
    defaultTone: string; // 'formal' | 'casual' etc.
}

const DEFAULT_SETTINGS: UserSettings = {
    signature: 'Sent from my AI Assistant',
    defaultTone: 'formal'
};

export class SettingsStore {

    async getSettings(userId?: string): Promise<UserSettings> {
        const db = await getDb();
        let row;

        if (userId) {
            row = await db.get('SELECT * FROM settings WHERE user_id = ?', userId);
        } else {
            // Try to find the first user if not specified (for single-user mode)
            const user = await userService.getFirstUser();
            if (user) {
                row = await db.get('SELECT * FROM settings WHERE user_id = ?', user.id);
            }
        }

        if (row) {
            const prefs = row.preferences ? JSON.parse(row.preferences) : {};
            return {
                signature: row.signature || DEFAULT_SETTINGS.signature,
                defaultTone: prefs.defaultTone || DEFAULT_SETTINGS.defaultTone
            };
        }

        return { ...DEFAULT_SETTINGS };
    }

    async updateSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings> {
        const db = await getDb();
        const current = await this.getSettings(userId);
        const newSettings = { ...current, ...updates };

        const prefs = {
            defaultTone: newSettings.defaultTone
        };

        const existing = await db.get('SELECT user_id FROM settings WHERE user_id = ?', userId);

        if (existing) {
            await db.run(
                'UPDATE settings SET signature = ?, preferences = ? WHERE user_id = ?',
                newSettings.signature,
                JSON.stringify(prefs),
                userId
            );
        } else {
            await db.run(
                'INSERT INTO settings (user_id, signature, preferences) VALUES (?, ?, ?)',
                userId,
                newSettings.signature,
                JSON.stringify(prefs)
            );
        }

        return newSettings;
    }
}

export const settingsStore = new SettingsStore();

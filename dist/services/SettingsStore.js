"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsStore = exports.SettingsStore = void 0;
const database_1 = require("../db/database");
const UserService_1 = require("./UserService");
const DEFAULT_SETTINGS = {
    signature: 'Sent from my AI Assistant',
    defaultTone: 'formal'
};
class SettingsStore {
    async getSettings(userId) {
        const db = await (0, database_1.getDb)();
        let row;
        if (userId) {
            row = await db.get('SELECT * FROM settings WHERE user_id = ?', userId);
        }
        else {
            // Try to find the first user if not specified (for single-user mode)
            const user = await UserService_1.userService.getFirstUser();
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
    async updateSettings(userId, updates) {
        const db = await (0, database_1.getDb)();
        const current = await this.getSettings(userId);
        const newSettings = { ...current, ...updates };
        const prefs = {
            defaultTone: newSettings.defaultTone
        };
        const existing = await db.get('SELECT user_id FROM settings WHERE user_id = ?', userId);
        if (existing) {
            await db.run('UPDATE settings SET signature = ?, preferences = ? WHERE user_id = ?', newSettings.signature, JSON.stringify(prefs), userId);
        }
        else {
            await db.run('INSERT INTO settings (user_id, signature, preferences) VALUES (?, ?, ?)', userId, newSettings.signature, JSON.stringify(prefs));
        }
        return newSettings;
    }
}
exports.SettingsStore = SettingsStore;
exports.settingsStore = new SettingsStore();

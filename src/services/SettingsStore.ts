import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

export interface UserSettings {
    signature: string;
    defaultTone: string; // 'formal' | 'casual' etc.
    // We can add more settings here later
}

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

const DEFAULT_SETTINGS: UserSettings = {
    signature: 'Sent from my AI Assistant',
    defaultTone: 'formal'
};

export class SettingsStore {
    private settings: UserSettings;

    constructor() {
        this.settings = this.load();
    }

    private load(): UserSettings {
        try {
            if (fs.existsSync(SETTINGS_FILE)) {
                const raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
                return JSON.parse(raw);
            }
        } catch (err) {
            logger.error('Failed to load settings, using defaults', err);
        }
        return { ...DEFAULT_SETTINGS };
    }

    private persist() {
        try {
            const dir = path.dirname(SETTINGS_FILE);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(SETTINGS_FILE, JSON.stringify(this.settings, null, 2), 'utf8');
        } catch (err) {
            logger.error('Failed to save settings', err);
        }
    }

    public getSettings(): UserSettings {
        return { ...this.settings };
    }

    public updateSettings(updates: Partial<UserSettings>): UserSettings {
        this.settings = { ...this.settings, ...updates };
        this.persist();
        return this.settings;
    }
}

export const settingsStore = new SettingsStore();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
const fs_1 = __importDefault(require("fs"));
let db = null;
async function getDb() {
    if (!db) {
        const dataDir = path_1.default.join(process.cwd(), 'data');
        if (!fs_1.default.existsSync(dataDir)) {
            fs_1.default.mkdirSync(dataDir, { recursive: true });
        }
        const dbPath = path_1.default.join(dataDir, 'draftly.db');
        db = await (0, sqlite_1.open)({
            filename: dbPath,
            driver: sqlite3_1.default.Database
        });
        await initDb(db);
    }
    return db;
}
async function initDb(db) {
    try {
        await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, -- Google User ID
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        access_token TEXT,
        refresh_token TEXT,
        token_expiry INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS drafts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        email_data TEXT, -- Store original email JSON
        draft_text TEXT,
        status TEXT DEFAULT 'pending',
        tone TEXT,
        history TEXT, -- JSON string
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS settings (
        user_id TEXT PRIMARY KEY,
        signature TEXT,
        preferences TEXT, -- JSON string
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
    `);
        logger_1.logger.info('Database tables initialized');
    }
    catch (err) {
        logger_1.logger.error('Failed to initialize database tables', err);
        throw err;
    }
}

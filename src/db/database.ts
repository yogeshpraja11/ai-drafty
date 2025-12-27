import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { logger } from '../utils/logger';
import fs from 'fs';

let db: Database | null = null;

export async function getDb() {
  if (!db) {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const dbPath = path.join(dataDir, 'draftly.db');
    
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    await initDb(db);
  }
  return db;
}

async function initDb(db: Database) {
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
    logger.info('Database tables initialized');
  } catch (err) {
    logger.error('Failed to initialize database tables', err);
    throw err;
  }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const database_1 = require("../db/database");
class UserService {
    async upsertUser(user) {
        const db = await (0, database_1.getDb)();
        const existing = await db.get('SELECT * FROM users WHERE email = ?', user.email);
        if (existing) {
            // Update tokens. Note: refresh_token might be undefined if not returned (only on first consent)
            // So we only update it if provided.
            const updateData = {
                name: user.name || existing.name,
                access_token: user.access_token || existing.access_token,
                refresh_token: user.refresh_token || existing.refresh_token,
                token_expiry: user.token_expiry || existing.token_expiry
            };
            await db.run(`UPDATE users SET name = ?, access_token = ?, refresh_token = ?, token_expiry = ? WHERE email = ?`, updateData.name, updateData.access_token, updateData.refresh_token, updateData.token_expiry, user.email);
            return { ...existing, ...updateData };
        }
        else {
            await db.run(`INSERT INTO users (id, email, name, access_token, refresh_token, token_expiry) VALUES (?, ?, ?, ?, ?, ?)`, user.id, user.email, user.name, user.access_token, user.refresh_token, user.token_expiry);
            return user;
        }
    }
    async getUser(id) {
        const db = await (0, database_1.getDb)();
        return db.get('SELECT * FROM users WHERE id = ?', id);
    }
    async getFirstUser() {
        // For single-user mode convenience
        const db = await (0, database_1.getDb)();
        return db.get('SELECT * FROM users LIMIT 1');
    }
    async getAllUsers() {
        const db = await (0, database_1.getDb)();
        return db.all('SELECT * FROM users');
    }
}
exports.UserService = UserService;
exports.userService = new UserService();

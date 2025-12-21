"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpamHandler = void 0;
class SpamHandler {
    spamKeywords = [
        'lottery', 'free money', 'urgent', 'click here',
        'discount', 'offer', 'winner', 'credit card'
    ];
    async isSpam(email) {
        const content = `${email.subject} ${email.text}`.toLowerCase();
        return this.spamKeywords.some(keyword => content.includes(keyword));
    }
}
exports.SpamHandler = SpamHandler;

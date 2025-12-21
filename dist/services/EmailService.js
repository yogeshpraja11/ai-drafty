"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const events_1 = require("events");
const nodemailer_1 = __importDefault(require("nodemailer"));
const imap_1 = __importDefault(require("imap"));
const mailparser_1 = require("mailparser");
const logger_1 = require("../utils/logger");
const config_1 = require("../config");
class EmailService extends events_1.EventEmitter {
    transporter;
    startTime;
    constructor() {
        super();
        this.startTime = new Date();
        this.transporter = this.createTransporter();
        this.setupPolling();
    }
    createTransporter() {
        return nodemailer_1.default.createTransport({
            service: 'gmail',
            auth: {
                user: config_1.config.email.user,
                pass: config_1.config.email.password
            }
        });
    }
    setupPolling() {
        setInterval(async () => {
            try {
                const emails = await this.fetchEmails();
                emails.forEach(email => this.emit('email:received', email));
            }
            catch (error) {
                logger_1.logger.error('Email polling failed:', error);
            }
        }, config_1.config.email.pollInterval);
    }
    async fetchEmails() {
        return new Promise((resolve, reject) => {
            const imap = new imap_1.default({
                user: config_1.config.email.user,
                password: config_1.config.email.password,
                host: 'imap.gmail.com',
                port: 993,
                tls: true,
                tlsOptions: {
                    rejectUnauthorized: false,
                    servername: 'imap.gmail.com'
                },
                authTimeout: 10000
            });
            const emails = [];
            imap.once('ready', () => {
                imap.openBox('INBOX', false, (err) => {
                    if (err)
                        return reject(err);
                    const searchCriteria = [
                        'UNSEEN',
                        ['SENTSINCE', this.formatImapDate(this.startTime)]
                    ];
                    imap.search(searchCriteria, (err, results) => {
                        if (err || !results?.length) {
                            imap.end();
                            return resolve([]);
                        }
                        const fetch = imap.fetch(results, {
                            bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
                            markSeen: true,
                            modifiers: { uid: true }
                        });
                        fetch.on('message', (msg) => {
                            let headers = {};
                            let text = '';
                            const uid = msg.uid;
                            msg.on('body', (stream, info) => {
                                let buffer = '';
                                stream.on('data', (chunk) => buffer += chunk.toString('utf8'));
                                stream.on('end', () => {
                                    if (info.which === 'HEADER.FIELDS (FROM TO SUBJECT DATE)') {
                                        headers = imap_1.default.parseHeader(buffer);
                                    }
                                    else {
                                        text = buffer;
                                    }
                                });
                            });
                            msg.once('end', async () => {
                                try {
                                    const parsed = await (0, mailparser_1.simpleParser)(text);
                                    const emailData = {
                                        id: uid?.toString() || Date.now().toString(),
                                        from: headers.from?.[0] || 'unknown@example.com',
                                        to: headers.to?.[0] || config_1.config.email.user,
                                        subject: headers.subject?.[0] || 'No Subject',
                                        text: parsed.text || '',
                                        date: headers.date?.[0] ? new Date(headers.date[0]) : new Date()
                                    };
                                    if (!emailData.from || !emailData.text) {
                                        logger_1.logger.error('Invalid email structure', headers);
                                        return;
                                    }
                                    emails.push(emailData);
                                }
                                catch (error) {
                                    logger_1.logger.error('Error parsing email:', error);
                                }
                            });
                        });
                        fetch.once('error', (err) => reject(err));
                        fetch.once('end', () => {
                            imap.end();
                            resolve(emails);
                        });
                    });
                });
            });
            imap.once('error', (err) => reject(err));
            imap.connect();
        });
    }
    formatImapDate(date) {
        return date.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).replace(/(\d+)\/(\d+)\/(\d+)/, '$1-$2-$3');
    }
    async sendReply(originalEmail, response) {
        try {
            await this.transporter.sendMail({
                from: config_1.config.email.user,
                to: originalEmail.from,
                subject: `Re: ${originalEmail.subject}`,
                text: response
            });
            logger_1.logger.info(`Replied to email from ${originalEmail.from}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to send reply:', error);
            throw error;
        }
    }
}
exports.EmailService = EmailService;

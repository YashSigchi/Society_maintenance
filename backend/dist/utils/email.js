"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmailNotification = void 0;
const resend_1 = require("resend");
const resend = process.env.RESEND_API_KEY ? new resend_1.Resend(process.env.RESEND_API_KEY) : null;
const sendEmailNotification = (to, subject, text) => __awaiter(void 0, void 0, void 0, function* () {
    if (!resend) {
        console.warn('[EMAIL MOCK] Missing RESEND_API_KEY. Email not sent.');
        console.log(`[EMAIL MOCK] To: ${to}\n[EMAIL MOCK] Subject: ${subject}\n[EMAIL MOCK] Body: ${text}`);
        return;
    }
    try {
        const from = process.env.EMAIL_FROM || 'updates@societyhub.com';
        yield resend.emails.send({
            from,
            to,
            subject,
            text
        });
        console.log(`Email successfully sent to ${to}`);
    }
    catch (error) {
        console.error('Failed to send email:', error);
        // Suppress error so we don't break transactions
    }
});
exports.sendEmailNotification = sendEmailNotification;

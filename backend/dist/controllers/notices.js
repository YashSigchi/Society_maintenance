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
exports.deleteNotice = exports.updateNotice = exports.createNotice = exports.getNotices = void 0;
const db_1 = require("../config/db");
const getNotices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notices = yield db_1.prisma.notice.findMany({
            include: { author: { select: { name: true } } },
            orderBy: [
                { important: 'desc' },
                { createdAt: 'desc' }
            ]
        });
        return res.json(notices);
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.getNotices = getNotices;
const email_1 = require("../utils/email");
const createNotice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, content, important } = req.body;
        const authorId = req.user.id;
        const notice = yield db_1.prisma.notice.create({
            data: {
                title,
                content,
                important,
                authorId
            }
        });
        if (important) {
            const residents = yield db_1.prisma.user.findMany({
                where: { role: 'RESIDENT' },
                select: { email: true }
            });
            const emailSubject = `[Important Notice] ${title}`;
            const emailText = `${content}\n\nCheck the Notice Board for more details.`;
            // Fire and forget
            for (const resident of residents) {
                (0, email_1.sendEmailNotification)(resident.email, emailSubject, emailText);
            }
        }
        return res.status(201).json(notice);
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.createNotice = createNotice;
const updateNotice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const { title, content, important } = req.body;
        const notice = yield db_1.prisma.notice.update({
            where: { id },
            data: { title, content, important }
        });
        return res.json(notice);
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.updateNotice = updateNotice;
const deleteNotice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        yield db_1.prisma.notice.delete({ where: { id } });
        return res.json({ message: 'Notice deleted' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.deleteNotice = deleteNotice;

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
exports.updateComplaintStatus = exports.getComplaintById = exports.getComplaints = exports.createComplaint = void 0;
const db_1 = require("../config/db");
const cloudinary_1 = require("../utils/cloudinary");
const email_1 = require("../utils/email");
const createComplaint = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { category, description } = req.body;
        const residentId = req.user.id;
        let attachmentData = undefined;
        if (req.file) {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(req.file.mimetype)) {
                return res.status(400).json({ message: 'Invalid file type. Only JPG, PNG, WEBP allowed.' });
            }
            const uploadResult = yield (0, cloudinary_1.uploadToCloudinary)(req.file.buffer, 'societyhub_complaints');
            attachmentData = {
                create: {
                    fileUrl: uploadResult.secure_url,
                    fileName: req.file.originalname,
                    mimeType: req.file.mimetype,
                    fileSize: req.file.size
                }
            };
        }
        const count = yield db_1.prisma.complaint.count();
        const complaintNumber = `CMP-${String(count + 1).padStart(4, '0')}`;
        const complaint = yield db_1.prisma.complaint.create({
            data: {
                complaintNumber,
                residentId,
                category,
                description,
                status: 'OPEN',
                priority: 'LOW',
                attachments: attachmentData,
                history: {
                    create: {
                        actorId: residentId,
                        previousStatus: 'OPEN',
                        newStatus: 'OPEN',
                        note: 'Resident submitted the complaint'
                    }
                }
            },
            include: { attachments: true }
        });
        return res.status(201).json(complaint);
    }
    catch (error) {
        console.error('Error creating complaint:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.createComplaint = createComplaint;
const getComplaints = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { role, id } = req.user;
        const where = role === 'RESIDENT' ? { residentId: id } : {};
        const setting = yield db_1.prisma.systemSetting.findUnique({ where: { key: 'OVERDUE_THRESHOLD_DAYS' } });
        const thresholdDays = parseInt((setting === null || setting === void 0 ? void 0 : setting.value) || '3', 10);
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - thresholdDays);
        let complaints = yield db_1.prisma.complaint.findMany({
            where,
            include: { resident: { select: { name: true, apartmentNumber: true } } },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' }
            ]
        });
        const enriched = complaints.map(c => (Object.assign(Object.assign({}, c), { isOverdue: c.status !== 'RESOLVED' && c.createdAt < thresholdDate })));
        if (role === 'ADMIN') {
            enriched.sort((a, b) => (b.isOverdue ? 1 : 0) - (a.isOverdue ? 1 : 0));
        }
        return res.json(enriched);
    }
    catch (error) {
        console.error('Error fetching complaints:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.getComplaints = getComplaints;
const getComplaintById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const { role, id: userId } = req.user;
        const complaint = yield db_1.prisma.complaint.findUnique({
            where: { id },
            include: {
                resident: { select: { name: true, apartmentNumber: true, email: true, phone: true } },
                attachments: true,
                history: {
                    include: { actor: { select: { name: true, role: true } } },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        if (!complaint)
            return res.status(404).json({ message: 'Not found' });
        if (role === 'RESIDENT' && complaint.residentId !== userId) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        return res.json(complaint);
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.getComplaintById = getComplaintById;
const updateComplaintStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = req.params.id;
        const { status, priority, note } = req.body;
        const actorId = req.user.id;
        const complaint = yield db_1.prisma.complaint.findUnique({
            where: { id },
            include: { resident: true }
        });
        if (!complaint)
            return res.status(404).json({ message: 'Not found' });
        // Enforce valid state transitions
        if (status && status !== complaint.status) {
            if (complaint.status === 'RESOLVED') {
                return res.status(400).json({ message: 'Cannot reopen a resolved complaint.' });
            }
            if (complaint.status === 'OPEN' && status === 'RESOLVED') {
                return res.status(400).json({ message: 'Complaint must be IN_PROGRESS before being RESOLVED.' });
            }
            if (complaint.status === 'IN_PROGRESS' && status === 'OPEN') {
                return res.status(400).json({ message: 'Cannot revert IN_PROGRESS complaint back to OPEN.' });
            }
        }
        const updated = yield db_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const dataToUpdate = {};
            if (status) {
                dataToUpdate.status = status;
                dataToUpdate.resolvedAt = status === 'RESOLVED' ? new Date() : null;
            }
            if (priority) {
                dataToUpdate.priority = priority;
            }
            const updatedComplaint = yield tx.complaint.update({
                where: { id },
                data: dataToUpdate
            });
            if (status && status !== complaint.status) {
                yield tx.complaintHistory.create({
                    data: {
                        complaintId: id,
                        actorId,
                        previousStatus: complaint.status,
                        newStatus: status,
                        note
                    }
                });
            }
            return updatedComplaint;
        }));
        // Notify resident
        if (status && status !== complaint.status && ((_a = complaint.resident) === null || _a === void 0 ? void 0 : _a.email)) {
            const emailSubject = `Update on your complaint: ${complaint.complaintNumber}`;
            const emailText = `The status of your complaint has been updated to ${status}. \n\nNote: ${note || 'No additional notes provided.'}`;
            // Do not await, fire and forget so failure doesn't crash the request
            (0, email_1.sendEmailNotification)(complaint.resident.email, emailSubject, emailText);
        }
        return res.json(updated);
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.updateComplaintStatus = updateComplaintStatus;

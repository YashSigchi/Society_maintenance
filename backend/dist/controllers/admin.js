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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdmin = exports.listAdmins = exports.getOverdueComplaints = exports.getDashboardAnalytics = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../config/db");
const getDashboardAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const totalComplaints = yield db_1.prisma.complaint.count();
        const openComplaints = yield db_1.prisma.complaint.count({ where: { status: 'OPEN' } });
        const inProgressComplaints = yield db_1.prisma.complaint.count({ where: { status: 'IN_PROGRESS' } });
        const resolvedComplaints = yield db_1.prisma.complaint.count({ where: { status: 'RESOLVED' } });
        const setting = yield db_1.prisma.systemSetting.findUnique({ where: { key: 'OVERDUE_THRESHOLD_DAYS' } });
        const thresholdDays = parseInt((setting === null || setting === void 0 ? void 0 : setting.value) || '3', 10);
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - thresholdDays);
        const overdueComplaints = yield db_1.prisma.complaint.count({
            where: {
                status: { not: 'RESOLVED' },
                createdAt: { lt: thresholdDate }
            }
        });
        const categories = yield db_1.prisma.complaint.groupBy({
            by: ['category'],
            _count: { category: true }
        });
        const categoryData = categories.map(c => ({
            name: c.category,
            value: c._count.category
        }));
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentComplaints = yield db_1.prisma.complaint.findMany({
            where: { createdAt: { gte: sevenDaysAgo } },
            select: { createdAt: true }
        });
        const trends = recentComplaints.reduce((acc, curr) => {
            const date = curr.createdAt.toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});
        const trendData = Object.keys(trends).map(date => ({
            date,
            count: trends[date]
        })).sort((a, b) => a.date.localeCompare(b.date));
        return res.json({
            summary: {
                total: totalComplaints,
                open: openComplaints,
                inProgress: inProgressComplaints,
                resolved: resolvedComplaints,
                overdue: overdueComplaints
            },
            categories: categoryData,
            trends: trendData
        });
    }
    catch (error) {
        console.error('Error fetching analytics:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.getDashboardAnalytics = getDashboardAnalytics;
const getOverdueComplaints = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const setting = yield db_1.prisma.systemSetting.findUnique({ where: { key: 'OVERDUE_THRESHOLD_DAYS' } });
        const thresholdDays = parseInt((setting === null || setting === void 0 ? void 0 : setting.value) || '3', 10);
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - thresholdDays);
        const overdue = yield db_1.prisma.complaint.findMany({
            where: {
                status: { not: 'RESOLVED' },
                createdAt: { lt: thresholdDate }
            },
            include: { resident: { select: { name: true, apartmentNumber: true } } },
            orderBy: { createdAt: 'asc' }
        });
        return res.json(overdue);
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.getOverdueComplaints = getOverdueComplaints;
const listAdmins = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const admins = yield db_1.prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                createdAt: true,
                mustChangePassword: true,
            },
            orderBy: { createdAt: 'asc' },
        });
        return res.json(admins);
    }
    catch (error) {
        console.error('Error listing admins:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.listAdmins = listAdmins;
const createAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password, phone } = req.body;
        const existingUser = yield db_1.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }
        const passwordHash = yield bcryptjs_1.default.hash(password, 10);
        const admin = yield db_1.prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                phone: phone || null,
                role: 'ADMIN',
                mustChangePassword: false,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                createdAt: true,
            },
        });
        return res.status(201).json({
            message: 'Admin account created',
            user: admin,
        });
    }
    catch (error) {
        console.error('Error creating admin:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.createAdmin = createAdmin;

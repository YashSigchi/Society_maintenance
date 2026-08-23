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
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Seeding Demo Data...');
        // Clean DB
        yield prisma.systemSetting.deleteMany();
        yield prisma.complaintHistory.deleteMany();
        yield prisma.complaintAttachment.deleteMany();
        yield prisma.complaint.deleteMany();
        yield prisma.notice.deleteMany();
        yield prisma.user.deleteMany();
        // Settings
        yield prisma.systemSetting.create({
            data: { key: 'OVERDUE_THRESHOLD_DAYS', value: '3' }
        });
        // Admin
        const adminPassword = yield bcryptjs_1.default.hash('admin123', 10);
        const admin = yield prisma.user.create({
            data: {
                name: 'Super Admin',
                email: 'admin@societyhub.com',
                passwordHash: adminPassword,
                role: 'ADMIN',
                phone: '1234567890',
                apartmentNumber: 'OFFICE',
                mustChangePassword: true,
            }
        });
        // Residents
        const residentPassword = yield bcryptjs_1.default.hash('resident123', 10);
        const r1 = yield prisma.user.create({
            data: { name: 'Alice Smith', email: 'alice@example.com', passwordHash: residentPassword, role: 'RESIDENT', apartmentNumber: 'A-101' }
        });
        const r2 = yield prisma.user.create({
            data: { name: 'Bob Jones', email: 'bob@example.com', passwordHash: residentPassword, role: 'RESIDENT', apartmentNumber: 'B-202' }
        });
        // Notices
        yield prisma.notice.create({
            data: { title: 'Welcome to SocietyHub', content: 'Our new portal is live.', important: false, authorId: admin.id }
        });
        yield prisma.notice.create({
            data: { title: 'Water Supply Maintenance', content: 'Water will be cut off tomorrow 10am-12pm for routine maintenance.', important: true, authorId: admin.id }
        });
        // Complaints
        // 1. New OPEN complaint
        yield prisma.complaint.create({
            data: {
                complaintNumber: 'CMP-0001', residentId: r1.id, category: 'Plumbing', description: 'Leaking tap in kitchen.', status: 'OPEN', priority: 'LOW',
                history: { create: { actorId: r1.id, previousStatus: 'OPEN', newStatus: 'OPEN', note: 'Resident submitted' } }
            }
        });
        // 2. IN_PROGRESS complaint
        yield prisma.complaint.create({
            data: {
                complaintNumber: 'CMP-0002', residentId: r2.id, category: 'Electrical', description: 'Hall lights not working.', status: 'IN_PROGRESS', priority: 'MEDIUM',
                history: {
                    create: [
                        { actorId: r2.id, previousStatus: 'OPEN', newStatus: 'OPEN', note: 'Submitted' },
                        { actorId: admin.id, previousStatus: 'OPEN', newStatus: 'IN_PROGRESS', note: 'Electrician assigned' }
                    ]
                }
            }
        });
        // 3. RESOLVED complaint
        yield prisma.complaint.create({
            data: {
                complaintNumber: 'CMP-0003', residentId: r1.id, category: 'Cleaning', description: 'Corridor dirty.', status: 'RESOLVED', priority: 'LOW', resolvedAt: new Date(),
                history: {
                    create: [
                        { actorId: r1.id, previousStatus: 'OPEN', newStatus: 'OPEN', note: 'Submitted' },
                        { actorId: admin.id, previousStatus: 'OPEN', newStatus: 'IN_PROGRESS', note: 'Assigned cleaner' },
                        { actorId: admin.id, previousStatus: 'IN_PROGRESS', newStatus: 'RESOLVED', note: 'Cleaned' }
                    ]
                }
            }
        });
        // 4. OVERDUE complaint (created 5 days ago)
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
        yield prisma.complaint.create({
            data: {
                complaintNumber: 'CMP-0004', residentId: r2.id, category: 'Security', description: 'Unauthorized parking in my slot.', status: 'OPEN', priority: 'HIGH',
                createdAt: fiveDaysAgo,
                updatedAt: fiveDaysAgo,
                history: { create: { actorId: r2.id, previousStatus: 'OPEN', newStatus: 'OPEN', note: 'Resident submitted', createdAt: fiveDaysAgo } }
            }
        });
        console.log('Demo Data Seeded successfully!');
    });
}
main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => __awaiter(void 0, void 0, void 0, function* () { yield prisma.$disconnect(); }));

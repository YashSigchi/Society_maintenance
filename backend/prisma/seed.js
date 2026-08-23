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
        const adminPassword = yield bcryptjs_1.default.hash('admin123', 10);
        const residentPassword = yield bcryptjs_1.default.hash('resident123', 10);
        const admin = yield prisma.user.upsert({
            where: { email: 'admin@societyhub.com' },
            update: {},
            create: {
                email: 'admin@societyhub.com',
                name: 'Admin User',
                passwordHash: adminPassword,
                role: 'ADMIN',
            },
        });
        const resident1 = yield prisma.user.upsert({
            where: { email: 'resident1@societyhub.com' },
            update: {},
            create: {
                email: 'resident1@societyhub.com',
                name: 'John Doe',
                passwordHash: residentPassword,
                role: 'RESIDENT',
                apartmentNumber: 'A-101',
                phone: '1234567890',
            },
        });
        const resident2 = yield prisma.user.upsert({
            where: { email: 'resident2@societyhub.com' },
            update: {},
            create: {
                email: 'resident2@societyhub.com',
                name: 'Jane Smith',
                passwordHash: residentPassword,
                role: 'RESIDENT',
                apartmentNumber: 'B-205',
                phone: '0987654321',
            },
        });
        const resident3 = yield prisma.user.upsert({
            where: { email: 'resident3@societyhub.com' },
            update: {},
            create: {
                email: 'resident3@societyhub.com',
                name: 'Alice Johnson',
                passwordHash: residentPassword,
                role: 'RESIDENT',
                apartmentNumber: 'C-302',
                phone: '1122334455',
            },
        });
        const complaint1 = yield prisma.complaint.upsert({
            where: { complaintNumber: 'CMP-0001' },
            update: {},
            create: {
                complaintNumber: 'CMP-0001',
                residentId: resident1.id,
                category: 'Plumbing',
                description: 'Water leakage under kitchen sink',
                status: 'OPEN',
                priority: 'HIGH',
            },
        });
        yield prisma.complaintHistory.create({
            data: {
                complaintId: complaint1.id,
                actorId: resident1.id,
                previousStatus: 'OPEN',
                newStatus: 'OPEN',
                note: 'Resident submitted the complaint',
            }
        });
        const complaint2 = yield prisma.complaint.upsert({
            where: { complaintNumber: 'CMP-0002' },
            update: {},
            create: {
                complaintNumber: 'CMP-0002',
                residentId: resident2.id,
                category: 'Electrical',
                description: 'Corridor light not working',
                status: 'IN_PROGRESS',
                priority: 'LOW',
            },
        });
        yield prisma.complaintHistory.createMany({
            data: [
                {
                    complaintId: complaint2.id,
                    actorId: resident2.id,
                    previousStatus: 'OPEN',
                    newStatus: 'OPEN',
                    note: 'Resident submitted the complaint',
                },
                {
                    complaintId: complaint2.id,
                    actorId: admin.id,
                    previousStatus: 'OPEN',
                    newStatus: 'IN_PROGRESS',
                    note: 'Maintenance team assigned',
                }
            ]
        });
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const complaint3 = yield prisma.complaint.upsert({
            where: { complaintNumber: 'CMP-0003' },
            update: {},
            create: {
                complaintNumber: 'CMP-0003',
                residentId: resident3.id,
                category: 'Elevator',
                description: 'Elevator not functioning properly on 3rd floor',
                status: 'OPEN',
                priority: 'HIGH',
                createdAt: thirtyDaysAgo, // To trigger overdue logic
            },
        });
        yield prisma.complaintHistory.create({
            data: {
                complaintId: complaint3.id,
                actorId: resident3.id,
                previousStatus: 'OPEN',
                newStatus: 'OPEN',
                note: 'Resident submitted the complaint',
                createdAt: thirtyDaysAgo,
            }
        });
        const notice1 = yield prisma.notice.create({
            data: {
                title: 'Water supply maintenance scheduled for Saturday',
                content: 'Please be informed that there will be a disruption in water supply on Saturday from 10 AM to 2 PM.',
                important: true,
                authorId: admin.id,
            }
        });
        yield prisma.systemSetting.upsert({
            where: { key: 'OVERDUE_THRESHOLD_DAYS' },
            update: {},
            create: {
                key: 'OVERDUE_THRESHOLD_DAYS',
                value: '3',
            }
        });
        console.log('Seeding completed.');
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));

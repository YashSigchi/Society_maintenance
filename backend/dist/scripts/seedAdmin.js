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
        const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@societyhub.com';
        const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'admin123';
        const existingAdmin = yield prisma.user.findUnique({
            where: { email: adminEmail }
        });
        if (existingAdmin) {
            console.log('Admin user already exists.');
            return;
        }
        const hashedPassword = yield bcryptjs_1.default.hash(adminPassword, 10);
        const admin = yield prisma.user.create({
            data: {
                name: 'System Admin',
                email: adminEmail,
                passwordHash: hashedPassword,
                role: 'ADMIN',
                phone: '1234567890',
                mustChangePassword: true,
            }
        });
        yield prisma.systemSetting.upsert({
            where: { key: 'OVERDUE_THRESHOLD_DAYS' },
            update: {},
            create: {
                key: 'OVERDUE_THRESHOLD_DAYS',
                value: '3'
            }
        });
        console.log('Default admin user created. Change this password after first login.');
        console.log(`Email: ${admin.email}`);
        console.log('Password: set via ADMIN_SEED_PASSWORD (see README). Do not commit production credentials.');
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

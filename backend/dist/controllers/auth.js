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
exports.changePassword = exports.getMe = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '7d',
    });
};
const publicUser = (user) => { var _a; return ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    apartmentNumber: user.apartmentNumber,
    mustChangePassword: (_a = user.mustChangePassword) !== null && _a !== void 0 ? _a : false,
}); };
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password, phone, apartmentNumber } = req.body;
        // Never trust a role supplied by the client. Public registration is residents only.
        const existingUser = yield db_1.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }
        const passwordHash = yield bcryptjs_1.default.hash(password, 10);
        const user = yield db_1.prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                phone: phone || null,
                apartmentNumber,
                role: 'RESIDENT',
                mustChangePassword: false,
            }
        });
        const token = generateToken(user.id);
        return res.status(201).json({
            token,
            user: publicUser(user),
        });
    }
    catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield db_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const isMatch = yield bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = generateToken(user.id);
        return res.json({
            token,
            user: publicUser(user),
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.login = login;
const getMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    return res.json({ user: req.user });
});
exports.getMe = getMe;
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        const user = yield db_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        const isMatch = yield bcryptjs_1.default.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }
        const passwordHash = yield bcryptjs_1.default.hash(newPassword, 10);
        const updated = yield db_1.prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash,
                mustChangePassword: false,
            },
        });
        return res.json({
            message: 'Password updated successfully',
            user: publicUser(updated),
        });
    }
    catch (error) {
        console.error('Change password error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.changePassword = changePassword;

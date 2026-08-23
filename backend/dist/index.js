"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const complaints_1 = __importDefault(require("./routes/complaints"));
const notices_1 = __importDefault(require("./routes/notices"));
const admin_1 = __importDefault(require("./routes/admin"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api/auth', auth_1.default);
app.use('/api/complaints', complaints_1.default);
app.use('/api/notices', notices_1.default);
app.use('/api/admin', admin_1.default);
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'SocietyHub API is running' });
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

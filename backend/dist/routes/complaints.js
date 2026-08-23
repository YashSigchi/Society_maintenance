"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const complaints_1 = require("../controllers/complaints");
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/', upload.single('photo'), complaints_1.createComplaint);
router.get('/', complaints_1.getComplaints);
router.get('/:id', complaints_1.getComplaintById);
router.patch('/:id', auth_1.requireAdmin, complaints_1.updateComplaintStatus);
exports.default = router;

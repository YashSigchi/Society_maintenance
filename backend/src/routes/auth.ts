import { Router } from 'express';
import multer from 'multer';
import { register, login, getMe, changePassword, updateProfile, uploadAvatar } from '../controllers/auth';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema, changePasswordSchema, updateProfileSchema } from '../validators/auth';
import { authenticate } from '../middleware/auth';

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: 1 },
});

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);
router.patch('/profile', authenticate, validate(updateProfileSchema), updateProfile);
router.post('/avatar', authenticate, avatarUpload.single('avatar'), uploadAvatar);

export default router;

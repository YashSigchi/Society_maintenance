import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { getNotices, createNotice, updateNotice, deleteNotice } from '../controllers/notices';

const router = Router();

router.use(authenticate);

router.get('/', getNotices);
router.post('/', requireAdmin, createNotice);
router.patch('/:id', requireAdmin, updateNotice);
router.delete('/:id', requireAdmin, deleteNotice);

export default router;

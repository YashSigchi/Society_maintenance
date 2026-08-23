import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { createComplaint, getComplaints, getComplaintById, updateComplaintStatus, bulkUpdateStatus, upsertNote } from '../controllers/complaints';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
});

const router = Router();

router.use(authenticate);

router.post('/', upload.fields([{ name: 'photos', maxCount: 10 }, { name: 'photo', maxCount: 1 }]), createComplaint);
router.post('/bulk-status', requireAdmin, bulkUpdateStatus);
router.get('/', getComplaints);
router.get('/:id', getComplaintById);
router.patch('/:id', requireAdmin, updateComplaintStatus);
router.post('/:id/notes', requireAdmin, upsertNote);
router.patch('/:id/notes/:noteId', requireAdmin, upsertNote);

export default router;

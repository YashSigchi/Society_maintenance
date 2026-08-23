import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { getDashboardAnalytics, getOverdueComplaints, listAdmins, createAdmin } from '../controllers/admin';
import { validate } from '../middleware/validate';
import { createAdminSchema } from '../validators/auth';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/dashboard', getDashboardAnalytics);
router.get('/overdue', getOverdueComplaints);
router.get('/users', listAdmins);
router.post('/users', validate(createAdminSchema), createAdmin);

export default router;

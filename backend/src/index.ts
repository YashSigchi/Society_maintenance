import dotenv from 'dotenv';
import path from 'path';

// Explicitly resolve the .env path relative to this file's directory,
// so it works regardless of the working directory used to launch the process.
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import complaintRoutes from './routes/complaints';
import noticeRoutes from './routes/notices';
import adminRoutes from './routes/admin';
import { startOverdueJob } from './jobs/overdue';
import { prisma } from './config/db';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SocietyHub API is running' });
});

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await prisma.systemSetting.upsert({
    where: { key: 'COMPLAINT_OVERDUE_HOURS' },
    update: {},
    create: { key: 'COMPLAINT_OVERDUE_HOURS', value: process.env.COMPLAINT_OVERDUE_HOURS || '48' },
  });
  startOverdueJob();
});

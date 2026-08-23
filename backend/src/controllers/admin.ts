import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db';
import { getOverdueCutoff } from '../jobs/overdue';

export const getDashboardAnalytics = async (req: Request, res: Response) => {
  try {
    const from = req.query.from ? new Date(String(req.query.from)) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = req.query.to ? new Date(String(req.query.to)) : new Date();
    to.setHours(23, 59, 59, 999);

    const range = { createdAt: { gte: from, lte: to } };
    const { cutoff } = await getOverdueCutoff();

    const [total, open, inProgress, resolved, overdue, ranged, allInRange] = await Promise.all([
      prisma.complaint.count(),
      prisma.complaint.count({ where: { status: 'OPEN' } }),
      prisma.complaint.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.complaint.count({ where: { status: 'RESOLVED' } }),
      prisma.complaint.count({ where: { status: { not: 'RESOLVED' }, createdAt: { lt: cutoff } } }),
      prisma.complaint.findMany({
        where: range,
        select: { createdAt: true, status: true, category: true, priority: true, resolvedAt: true },
      }),
      prisma.complaint.findMany({
        where: { ...range, status: 'RESOLVED', resolvedAt: { not: null } },
        select: { category: true, createdAt: true, resolvedAt: true },
      }),
    ]);

    const trendsMap: Record<string, number> = {};
    const statusCounts = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0 };
    const categoryMap: Record<string, number> = {};
    const priorityStatus: Record<string, { LOW: number; MEDIUM: number; HIGH: number }> = {
      OPEN: { LOW: 0, MEDIUM: 0, HIGH: 0 },
      IN_PROGRESS: { LOW: 0, MEDIUM: 0, HIGH: 0 },
      RESOLVED: { LOW: 0, MEDIUM: 0, HIGH: 0 },
    };
    const heatmap: Record<string, number> = {};

    for (const c of ranged) {
      const day = c.createdAt.toISOString().split('T')[0];
      trendsMap[day] = (trendsMap[day] || 0) + 1;
      statusCounts[c.status] += 1;
      categoryMap[c.category] = (categoryMap[c.category] || 0) + 1;
      priorityStatus[c.status][c.priority] += 1;
      heatmap[day] = (heatmap[day] || 0) + 1;
    }

    const resolutionByCategory: Record<string, { totalMs: number; count: number }> = {};
    for (const c of allInRange) {
      if (!c.resolvedAt) continue;
      const ms = c.resolvedAt.getTime() - c.createdAt.getTime();
      if (!resolutionByCategory[c.category]) resolutionByCategory[c.category] = { totalMs: 0, count: 0 };
      resolutionByCategory[c.category].totalMs += ms;
      resolutionByCategory[c.category].count += 1;
    }

    const avgResolutionHours = allInRange.length
      ? allInRange.reduce((sum, c) => sum + ((c.resolvedAt!.getTime() - c.createdAt.getTime()) / 36e5), 0) / allInRange.length
      : 0;

    return res.json({
      summary: {
        total,
        open,
        inProgress,
        resolved,
        overdue,
        avgResolutionHours: Number(avgResolutionHours.toFixed(1)),
      },
      trends: Object.keys(trendsMap).sort().map((date) => ({ date, count: trendsMap[date] })),
      statusDistribution: [
        { name: 'Open', value: statusCounts.OPEN },
        { name: 'In Progress', value: statusCounts.IN_PROGRESS },
        { name: 'Resolved', value: statusCounts.RESOLVED },
      ],
      categories: Object.entries(categoryMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      priorityBreakdown: ['OPEN', 'IN_PROGRESS', 'RESOLVED'].map((status) => ({
        status: status.replace('_', ' '),
        ...priorityStatus[status],
      })),
      resolutionByCategory: Object.entries(resolutionByCategory).map(([name, v]) => ({
        name,
        hours: Number((v.totalMs / v.count / 36e5).toFixed(1)),
      })),
      heatmap: Object.entries(heatmap).map(([date, count]) => ({ date, count })),
      range: { from: from.toISOString(), to: to.toISOString() },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getOverdueComplaints = async (req: Request, res: Response) => {
  try {
    const { cutoff } = await getOverdueCutoff();
    const overdue = await prisma.complaint.findMany({
      where: {
        status: { not: 'RESOLVED' },
        createdAt: { lt: cutoff },
      },
      include: {
        resident: { select: { name: true, apartmentNumber: true, avatarUrl: true } },
        attachments: { take: 1, orderBy: { sortOrder: 'asc' } },
        _count: { select: { notes: true, attachments: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.json(overdue.map((c) => ({
      ...c,
      isOverdue: true,
      notesCount: c._count.notes,
      hasNotes: c._count.notes > 0,
    })));
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const listAdmins = async (req: Request, res: Response) => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        mustChangePassword: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    return res.json(admins);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createAdmin = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone: phone || null,
        role: 'ADMIN',
        mustChangePassword: false,
      },
      select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
    });

    return res.status(201).json({ message: 'Admin account created', user: admin });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { notifyQuietly, noticeEmailHtml } from '../utils/email';
import { formatMailDate } from '../utils/media';

export const getNotices = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize || '20'), 10)));
    
    const [total, notices] = await Promise.all([
      prisma.notice.count(),
      prisma.notice.findMany({
        include: { author: { select: { name: true } } },
        orderBy: [{ important: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return res.json({ items: notices, total, page, pageSize });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createNotice = async (req: Request, res: Response) => {
  try {
    const { title, content, important } = req.body;
    const authorId = req.user.id;

    const notice = await prisma.notice.create({
      data: { title, content, important, authorId },
    });

    const residents = await prisma.user.findMany({
      where: { role: 'RESIDENT' },
      select: { email: true },
    });
    const subject = important ? `[Important Notice] ${title}` : `[Notice] ${title}`;
    const html = noticeEmailHtml({
      title,
      content,
      important: Boolean(important),
      when: formatMailDate(notice.createdAt),
    });
    for (const resident of residents) {
      notifyQuietly(resident.email, subject, html);
    }

    return res.status(201).json(notice);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateNotice = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { title, content, important } = req.body;

    const notice = await prisma.notice.update({
      where: { id },
      data: { title, content, important },
    });

    if (important) {
      const residents = await prisma.user.findMany({
        where: { role: 'RESIDENT' },
        select: { email: true },
      });
      const html = noticeEmailHtml({
        title: notice.title,
        content: notice.content,
        important: true,
        when: formatMailDate(notice.updatedAt),
      });
      for (const resident of residents) {
        notifyQuietly(resident.email, `[Important Notice updated] ${notice.title}`, html);
      }
    }

    return res.json(notice);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteNotice = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.notice.delete({ where: { id } });
    return res.json({ message: 'Notice deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

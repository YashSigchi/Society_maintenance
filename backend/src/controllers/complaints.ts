import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { uploadToCloudinary } from '../utils/cloudinary';
import { notifyQuietly, complaintEmailHtml } from '../utils/email';
import { getOverdueCutoff } from '../jobs/overdue';
import { thumbnailFromUrl, formatMailDate } from '../utils/media';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const collectFiles = (req: Request) => {
  const files: Express.Multer.File[] = [];
  if (Array.isArray(req.files)) files.push(...req.files);
  else if (req.files && typeof req.files === 'object') {
    Object.values(req.files).forEach((group) => {
      if (Array.isArray(group)) files.push(...group);
    });
  }
  if (req.file) files.push(req.file);
  return files.slice(0, 10);
};

export const createComplaint = async (req: Request, res: Response) => {
  try {
    const { category, description, location } = req.body;
    const residentId = req.user.id;
    const files = collectFiles(req);

    if (!category || !description?.trim()) {
      return res.status(400).json({ message: 'Category and description are required' });
    }

    const attachments = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!ALLOWED_TYPES.includes(file.mimetype)) {
        return res.status(400).json({ message: 'Invalid file type. Only JPG, PNG, WEBP allowed.' });
      }
      const uploadResult = await uploadToCloudinary(file.buffer, 'societyhub_complaints');
      attachments.push({
        fileUrl: uploadResult.secure_url,
        thumbnailUrl: thumbnailFromUrl(uploadResult.secure_url),
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        sortOrder: i,
      });
    }

    const count = await prisma.complaint.count();
    const complaintNumber = `CMP-${String(count + 1).padStart(4, '0')}`;

    const complaint = await prisma.complaint.create({
      data: {
        complaintNumber,
        residentId,
        category,
        description,
        location: location || null,
        status: 'OPEN',
        priority: 'LOW',
        attachments: attachments.length ? { create: attachments } : undefined,
        history: {
          create: {
            actorId: residentId,
            previousStatus: 'OPEN',
            newStatus: 'OPEN',
            eventType: 'CREATED',
            note: 'Resident submitted the complaint',
          },
        },
      },
      include: { attachments: true, resident: true },
    });

    if (complaint.resident?.email) {
      notifyQuietly(
        complaint.resident.email,
        `Complaint ${complaint.complaintNumber} submitted`,
        complaintEmailHtml({
          heading: 'Complaint submitted successfully',
          intro: `We have received your maintenance request and our team will review it shortly.`,
          complaintNumber: complaint.complaintNumber,
          status: 'OPEN',
          category: complaint.category,
          when: formatMailDate(complaint.createdAt),
        })
      );
    }

    return res.status(201).json(complaint);
  } catch (error) {
    console.error('Error creating complaint:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getComplaints = async (req: Request, res: Response) => {
  try {
    const { role, id } = req.user;
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize || '20'), 10)));
    const where = role === 'RESIDENT' ? { residentId: id } : {};

    const { cutoff } = await getOverdueCutoff();

    const [total, complaints] = await Promise.all([
      prisma.complaint.count({ where }),
      prisma.complaint.findMany({
        where,
        include: {
          resident: { select: { name: true, apartmentNumber: true, email: true, avatarUrl: true } },
          attachments: { orderBy: { sortOrder: 'asc' }, select: { id: true, fileUrl: true, thumbnailUrl: true, fileName: true } },
          _count: { select: { notes: true, attachments: true } },
        },
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const enriched = complaints.map((c) => {
      const isOverdue = c.status !== 'RESOLVED' && c.createdAt < cutoff;
      const { _count, ...rest } = c as typeof c & { notes?: unknown };
      return {
        ...rest,
        isOverdue,
        notesCount: role === 'ADMIN' ? _count.notes : undefined,
        hasNotes: role === 'ADMIN' ? _count.notes > 0 : undefined,
      };
    });

    if (role === 'ADMIN') {
      enriched.sort((a, b) => Number(b.isOverdue) - Number(a.isOverdue));
    }

    return res.json({ items: enriched, total, page, pageSize });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getComplaintById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { role, id: userId } = req.user;
    const { cutoff } = await getOverdueCutoff();

    const complaint: any = await prisma.complaint.findUnique({
      where: { id },
      include: {
        resident: { select: { name: true, apartmentNumber: true, email: true, phone: true, avatarUrl: true } },
        attachments: { orderBy: { sortOrder: 'asc' } },
        history: {
          include: { actor: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
        notes: role === 'ADMIN' ? {
          include: { author: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        } : false,
      },
    });

    if (!complaint) return res.status(404).json({ message: 'Not found' });

    if (role === 'RESIDENT' && complaint.residentId !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    complaint.isOverdue = complaint.status !== 'RESOLVED' && complaint.createdAt < cutoff;
    if (role !== 'ADMIN') delete complaint.notes;

    return res.json(complaint);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateComplaintStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, priority, note } = req.body;
    const actorId = req.user.id;

    const complaint: any = await prisma.complaint.findUnique({
      where: { id },
      include: { resident: true },
    });
    if (!complaint) return res.status(404).json({ message: 'Not found' });

    if (status && status !== complaint.status) {
      const reopening = complaint.status === 'RESOLVED' && (status === 'OPEN' || status === 'IN_PROGRESS');
      if (complaint.status === 'RESOLVED' && !reopening) {
        return res.status(400).json({ message: 'Cannot change a resolved complaint except to reopen it.' });
      }
      if (!reopening && complaint.status === 'OPEN' && status === 'RESOLVED') {
        return res.status(400).json({ message: 'Complaint must be IN_PROGRESS before being RESOLVED.' });
      }
      if (!reopening && complaint.status === 'IN_PROGRESS' && status === 'OPEN') {
        return res.status(400).json({ message: 'Cannot revert IN_PROGRESS complaint back to OPEN.' });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const dataToUpdate: any = {};
      if (status) {
        dataToUpdate.status = status;
        dataToUpdate.resolvedAt = status === 'RESOLVED' ? new Date() : null;
      }
      if (priority) dataToUpdate.priority = priority;

      const updatedComplaint = await tx.complaint.update({
        where: { id },
        data: dataToUpdate,
      });

      if (status && status !== complaint.status) {
        const reopening = complaint.status === 'RESOLVED';
        await tx.complaintHistory.create({
          data: {
            complaintId: id,
            actorId,
            previousStatus: complaint.status,
            newStatus: status,
            eventType: reopening ? 'REOPENED' : 'STATUS',
            note: note || (reopening ? 'Complaint reopened' : `Status changed to ${status}`),
          },
        });
      }

      return updatedComplaint;
    });

    if (status && status !== complaint.status && complaint.resident?.email) {
      const reopening = complaint.status === 'RESOLVED';
      const heading = reopening
        ? 'Your complaint was reopened'
        : status === 'IN_PROGRESS'
          ? 'Your complaint is in progress'
          : status === 'RESOLVED'
            ? 'Your complaint has been resolved'
            : 'Complaint status updated';
      notifyQuietly(
        complaint.resident.email,
        `${heading}: ${complaint.complaintNumber}`,
        complaintEmailHtml({
          heading,
          intro: note || `The status of your complaint is now ${status.replace('_', ' ')}.`,
          complaintNumber: complaint.complaintNumber,
          status,
          category: complaint.category,
          when: formatMailDate(),
        })
      );
    }

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const bulkUpdateStatus = async (req: Request, res: Response) => {
  try {
    const { ids, status } = req.body as { ids: string[]; status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' };
    if (!Array.isArray(ids) || !ids.length || !status) {
      return res.status(400).json({ message: 'ids and status are required' });
    }

    let updated = 0;
    for (const id of ids) {
      const original = { ...req.body, status };
      req.params.id = id;
      req.body = original;
      const mockRes = {
        statusCode: 200,
        status(code: number) { this.statusCode = code; return this; },
        json() { return this; },
      } as unknown as Response;
      await updateComplaintStatus(req, mockRes);
      if ((mockRes as any).statusCode < 400) updated += 1;
    }

    return res.json({ updated });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const upsertNote = async (req: Request, res: Response) => {
  try {
    const complaintId = req.params.id as string;
    const noteId = req.params.noteId as string | undefined;
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Note content is required' });

    const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    const note = noteId
      ? await prisma.complaintNote.update({
          where: { id: noteId },
          data: { content: content.trim() },
          include: { author: { select: { name: true } } },
        })
      : await prisma.complaintNote.create({
          data: {
            complaintId,
            authorId: req.user.id,
            content: content.trim(),
          },
          include: { author: { select: { name: true } } },
        });

    return res.status(noteId ? 200 : 201).json(note);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

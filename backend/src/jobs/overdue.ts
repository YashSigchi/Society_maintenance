import { prisma } from '../config/db';
import { notifyQuietly, complaintEmailHtml } from '../utils/email';

export async function getOverdueCutoff() {
  const setting = await prisma.systemSetting.findUnique({ where: { key: 'COMPLAINT_OVERDUE_HOURS' } });
  const hours = parseInt(setting?.value || process.env.COMPLAINT_OVERDUE_HOURS || '48', 10);
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  return { hours, cutoff };
}

export async function escalateOverdueComplaints() {
  try {
    const { hours, cutoff } = await getOverdueCutoff();
    const overdue = await prisma.complaint.findMany({
      where: {
        status: { not: 'RESOLVED' },
        createdAt: { lt: cutoff },
        overdueEscalatedAt: null,
      },
      include: { resident: { select: { name: true, apartmentNumber: true } } },
    });

    if (!overdue.length) return;

    const systemActor = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { email: true } });

    for (const complaint of overdue) {
      await prisma.$transaction(async (tx) => {
        await tx.complaint.update({
          where: { id: complaint.id },
          data: {
            priority: 'HIGH',
            overdueEscalatedAt: new Date(),
          },
        });
        if (systemActor) {
          await tx.complaintHistory.create({
            data: {
              complaintId: complaint.id,
              actorId: systemActor.id,
              previousStatus: complaint.status,
              newStatus: complaint.status,
              eventType: 'ESCALATION',
              note: `Automatically escalated to High priority after ${hours} hours unresolved.`,
            },
          });
        }
      });

      const when = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
      for (const admin of admins) {
        notifyQuietly(
          admin.email,
          `Overdue complaint ${complaint.complaintNumber}`,
          complaintEmailHtml({
            heading: 'Complaint overdue',
            intro: `${complaint.complaintNumber} from ${complaint.resident?.name || 'a resident'} (${complaint.resident?.apartmentNumber || 'N/A'}) has exceeded the ${hours}-hour SLA and was auto-escalated to High priority.`,
            complaintNumber: complaint.complaintNumber,
            status: complaint.status,
            category: complaint.category,
            when,
          })
        );
      }
    }
  } catch (error) {
    console.error('Overdue escalation job failed:', error);
  }
}

export function startOverdueJob() {
  escalateOverdueComplaints();
  const intervalMs = parseInt(process.env.OVERDUE_JOB_INTERVAL_MS || `${15 * 60 * 1000}`, 10);
  setInterval(escalateOverdueComplaints, intervalMs);
}

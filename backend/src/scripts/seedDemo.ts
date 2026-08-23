import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Demo Data...');
  
  // Clean DB
  await prisma.systemSetting.deleteMany();
  await prisma.complaintHistory.deleteMany();
  await prisma.complaintAttachment.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.user.deleteMany();

  // Settings
  await prisma.systemSetting.create({
    data: { key: 'OVERDUE_THRESHOLD_DAYS', value: '3' }
  });

  // Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@societyhub.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      phone: '1234567890',
      apartmentNumber: 'OFFICE',
      mustChangePassword: true,
    }
  });

  // Residents
  const residentPassword = await bcrypt.hash('resident123', 10);
  const r1 = await prisma.user.create({
    data: { name: 'Alice Smith', email: 'alice@example.com', passwordHash: residentPassword, role: 'RESIDENT', apartmentNumber: 'A-101' }
  });
  const r2 = await prisma.user.create({
    data: { name: 'Bob Jones', email: 'bob@example.com', passwordHash: residentPassword, role: 'RESIDENT', apartmentNumber: 'B-202' }
  });

  // Notices
  await prisma.notice.create({
    data: { title: 'Welcome to SocietyHub', content: 'Our new portal is live.', important: false, authorId: admin.id }
  });
  await prisma.notice.create({
    data: { title: 'Water Supply Maintenance', content: 'Water will be cut off tomorrow 10am-12pm for routine maintenance.', important: true, authorId: admin.id }
  });

  // Complaints
  // 1. New OPEN complaint
  await prisma.complaint.create({
    data: {
      complaintNumber: 'CMP-0001', residentId: r1.id, category: 'Plumbing', description: 'Leaking tap in kitchen.', status: 'OPEN', priority: 'LOW',
      history: { create: { actorId: r1.id, previousStatus: 'OPEN', newStatus: 'OPEN', note: 'Resident submitted' } }
    }
  });

  // 2. IN_PROGRESS complaint
  await prisma.complaint.create({
    data: {
      complaintNumber: 'CMP-0002', residentId: r2.id, category: 'Electrical', description: 'Hall lights not working.', status: 'IN_PROGRESS', priority: 'MEDIUM',
      history: {
        create: [
          { actorId: r2.id, previousStatus: 'OPEN', newStatus: 'OPEN', note: 'Submitted' },
          { actorId: admin.id, previousStatus: 'OPEN', newStatus: 'IN_PROGRESS', note: 'Electrician assigned' }
        ]
      }
    }
  });

  // 3. RESOLVED complaint
  await prisma.complaint.create({
    data: {
      complaintNumber: 'CMP-0003', residentId: r1.id, category: 'Cleaning', description: 'Corridor dirty.', status: 'RESOLVED', priority: 'LOW', resolvedAt: new Date(),
      history: {
        create: [
          { actorId: r1.id, previousStatus: 'OPEN', newStatus: 'OPEN', note: 'Submitted' },
          { actorId: admin.id, previousStatus: 'OPEN', newStatus: 'IN_PROGRESS', note: 'Assigned cleaner' },
          { actorId: admin.id, previousStatus: 'IN_PROGRESS', newStatus: 'RESOLVED', note: 'Cleaned' }
        ]
      }
    }
  });

  // 4. OVERDUE complaint (created 5 days ago)
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  await prisma.complaint.create({
    data: {
      complaintNumber: 'CMP-0004', residentId: r2.id, category: 'Security', description: 'Unauthorized parking in my slot.', status: 'OPEN', priority: 'HIGH',
      createdAt: fiveDaysAgo,
      updatedAt: fiveDaysAgo,
      history: { create: { actorId: r2.id, previousStatus: 'OPEN', newStatus: 'OPEN', note: 'Resident submitted', createdAt: fiveDaysAgo } }
    }
  });

  console.log('Demo Data Seeded successfully!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

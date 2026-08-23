import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const residentPassword = await bcrypt.hash('resident123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@societyhub.com' },
    update: {},
    create: {
      email: 'admin@societyhub.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: 'ADMIN',
      mustChangePassword: true,
    },
  });

  const resident1 = await prisma.user.upsert({
    where: { email: 'resident1@societyhub.com' },
    update: {},
    create: {
      email: 'resident1@societyhub.com',
      name: 'John Doe',
      passwordHash: residentPassword,
      role: 'RESIDENT',
      apartmentNumber: 'A-101',
      phone: '1234567890',
    },
  });

  const resident2 = await prisma.user.upsert({
    where: { email: 'resident2@societyhub.com' },
    update: {},
    create: {
      email: 'resident2@societyhub.com',
      name: 'Jane Smith',
      passwordHash: residentPassword,
      role: 'RESIDENT',
      apartmentNumber: 'B-205',
      phone: '0987654321',
    },
  });

  const resident3 = await prisma.user.upsert({
    where: { email: 'resident3@societyhub.com' },
    update: {},
    create: {
      email: 'resident3@societyhub.com',
      name: 'Alice Johnson',
      passwordHash: residentPassword,
      role: 'RESIDENT',
      apartmentNumber: 'C-302',
      phone: '1122334455',
    },
  });

  const complaint1 = await prisma.complaint.upsert({
    where: { complaintNumber: 'CMP-0001' },
    update: {},
    create: {
      complaintNumber: 'CMP-0001',
      residentId: resident1.id,
      category: 'Plumbing',
      description: 'Water leakage under kitchen sink',
      status: 'OPEN',
      priority: 'HIGH',
    },
  });

  await prisma.complaintHistory.create({
    data: {
      complaintId: complaint1.id,
      actorId: resident1.id,
      previousStatus: 'OPEN',
      newStatus: 'OPEN',
      note: 'Resident submitted the complaint',
    }
  });

  const complaint2 = await prisma.complaint.upsert({
    where: { complaintNumber: 'CMP-0002' },
    update: {},
    create: {
      complaintNumber: 'CMP-0002',
      residentId: resident2.id,
      category: 'Electrical',
      description: 'Corridor light not working',
      status: 'IN_PROGRESS',
      priority: 'LOW',
    },
  });

  await prisma.complaintHistory.createMany({
    data: [
      {
        complaintId: complaint2.id,
        actorId: resident2.id,
        previousStatus: 'OPEN',
        newStatus: 'OPEN',
        note: 'Resident submitted the complaint',
      },
      {
        complaintId: complaint2.id,
        actorId: admin.id,
        previousStatus: 'OPEN',
        newStatus: 'IN_PROGRESS',
        note: 'Maintenance team assigned',
      }
    ]
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const complaint3 = await prisma.complaint.upsert({
    where: { complaintNumber: 'CMP-0003' },
    update: {},
    create: {
      complaintNumber: 'CMP-0003',
      residentId: resident3.id,
      category: 'Elevator',
      description: 'Elevator not functioning properly on 3rd floor',
      status: 'OPEN',
      priority: 'HIGH',
      createdAt: thirtyDaysAgo, // To trigger overdue logic
    },
  });

  await prisma.complaintHistory.create({
    data: {
      complaintId: complaint3.id,
      actorId: resident3.id,
      previousStatus: 'OPEN',
      newStatus: 'OPEN',
      note: 'Resident submitted the complaint',
      createdAt: thirtyDaysAgo,
    }
  });

  const notice1 = await prisma.notice.create({
    data: {
      title: 'Water supply maintenance scheduled for Saturday',
      content: 'Please be informed that there will be a disruption in water supply on Saturday from 10 AM to 2 PM.',
      important: true,
      authorId: admin.id,
    }
  });

  await prisma.systemSetting.upsert({
    where: { key: 'OVERDUE_THRESHOLD_DAYS' },
    update: {},
    create: {
      key: 'OVERDUE_THRESHOLD_DAYS',
      value: '3',
    }
  });

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

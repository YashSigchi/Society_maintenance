import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@societyhub.com';
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'admin123';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (existingAdmin) {
    console.log('Admin user already exists.');
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: adminEmail,
      passwordHash: hashedPassword,
      role: 'ADMIN',
      phone: '1234567890',
      mustChangePassword: true,
    }
  });

  await prisma.systemSetting.upsert({
    where: { key: 'OVERDUE_THRESHOLD_DAYS' },
    update: {},
    create: {
      key: 'OVERDUE_THRESHOLD_DAYS',
      value: '3'
    }
  });

  console.log('Default admin user created. Change this password after first login.');
  console.log(`Email: ${admin.email}`);
  console.log('Password: set via ADMIN_SEED_PASSWORD (see README). Do not commit production credentials.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin@12345', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sidaz.com' },
    update: {},
    create: {
      email: 'admin@sidaz.com',
      password: hashedPassword,
      name: 'Admin',
      role: UserRole.ADMIN,
    },
  });

  console.log('Admin user seeded:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

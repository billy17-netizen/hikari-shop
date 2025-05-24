import { PrismaClient } from '../src/generated/prisma';
import * as bcrypt from 'bcryptjs';

// Initialize Prisma Client
const prisma = new PrismaClient();

async function main() {
  console.log('Starting admin user seed...');

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@hikarishop.com' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists, skipping creation');
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Create admin user with raw query to ensure role is set correctly
    // This bypasses TypeScript validation since our model has just been updated
    await prisma.$executeRaw`
      INSERT INTO "User" (
        "id",
        "name",
        "email",
        "password",
        "role",
        "createdAt",
        "updatedAt"
      ) VALUES (
        ${`admin-${Date.now()}`},
        ${'Admin User'},
        ${'admin@hikarishop.com'},
        ${hashedPassword},
        ${'admin'},
        ${new Date()},
        ${new Date()}
      )
    `;

    console.log('Created admin user successfully!');
    console.log('Admin seed completed successfully!');
  } catch (error) {
    console.error('Error during admin seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Executing migration to remove category column...');
    
    // Drop the category column
    await prisma.$executeRawUnsafe(`ALTER TABLE "Product" DROP COLUMN IF EXISTS "category";`);
    
    console.log('Migration executed successfully!');
  } catch (error) {
    console.error('Error executing migration:', error);
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
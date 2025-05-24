-- AlterTable: Drop category column from Product table
ALTER TABLE "Product" DROP COLUMN IF EXISTS "category";
 
-- Update migration_lock
-- This is handled automatically by Prisma 
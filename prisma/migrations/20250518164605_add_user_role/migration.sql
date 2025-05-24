-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'user';

-- Insert admin user if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "User" WHERE "email" = 'admin@hikarishop.com') THEN
        INSERT INTO "User" (
            "id",
            "name",
            "email",
            "password",
            "role",
            "createdAt",
            "updatedAt"
        ) VALUES (
            'admin-user-001',
            'Admin User',
            'admin@hikarishop.com',
            '$2a$12$QZFUXy5Zz.JUe6eO6Bnbh.Yp2j4BUTO25MF7dL9g5QGsL/nPg8vC6', -- bcrypt hash for 'admin123'
            'admin',
            NOW(),
            NOW()
        );
    END IF;
END
$$;

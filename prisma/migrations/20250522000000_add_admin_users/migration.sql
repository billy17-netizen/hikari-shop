-- CreateAdminUsers
-- This migration adds the default admin user to the database

-- Delete existing admin users if they exist (to prevent duplicates)
DELETE FROM "User" WHERE email IN ('admin@example.com', 'admin@hikari-shop.com');

-- Insert admin user
-- Password hash is for 'admin123'
INSERT INTO "User" (
  id,
  name,
  email,
  password,
  role,
  "createdAt",
  "updatedAt"
)
VALUES (
  'admin-default-001',
  'Admin User',
  'admin@example.com',
  '$2b$10$IvfuzJ.LF3ujUGOGwguPqOsmItPDsuNeqvQRUdJjEy13Y2MpkjzGG', -- bcrypt hash for 'admin123'
  'admin',
  NOW(),
  NOW()
); 
const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    console.log('Checking admin user...');
    
    // Find the admin user
    const admin = await prisma.user.findUnique({
      where: {
        email: 'admin@example.com'
      }
    });
    
    if (!admin) {
      console.log('Admin user not found!');
      return;
    }
    
    console.log('Admin user found:');
    console.log({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      passwordLength: admin.password?.length || 0
    });
    
    // Check if the password matches 'admin123'
    const passwordMatches = await bcrypt.compare('admin123', admin.password);
    console.log('Password matches "admin123":', passwordMatches);
    
    // Create a new hash for 'admin123' for comparison
    const newHash = await bcrypt.hash('admin123', 10);
    console.log('New hash for "admin123":', newHash);
    
    // Check if the role is properly set
    console.log('Role is properly set to "admin":', admin.role === 'admin');
    
  } catch (error) {
    console.error('Error checking admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin(); 
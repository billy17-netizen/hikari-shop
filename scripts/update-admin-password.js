const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updateAdminPassword() {
  try {
    console.log('Updating admin password...');
    
    // Hash the password 'admin123'
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('Generated hash for "admin123":', hashedPassword);
    
    // Update the admin user's password
    const updatedAdmin = await prisma.user.update({
      where: {
        email: 'admin@example.com'
      },
      data: {
        password: hashedPassword
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });
    
    console.log('Admin password updated successfully:');
    console.log(updatedAdmin);
    
    console.log('\nYou can now log in with:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Error updating admin password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword(); 
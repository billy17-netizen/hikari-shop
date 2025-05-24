const { execSync } = require('child_process');

/**
 * Script to reset the database and apply all migrations
 * This will:
 * 1. Drop the database
 * 2. Create a new database
 * 3. Apply all migrations
 * 4. Seed the database with one admin user, test user, and 10 products
 */
async function resetDatabase() {
  try {
    console.log('🔄 Starting database reset process...');
    
    // Reset the database
    console.log('Resetting database...');
    execSync('npx prisma migrate reset --force', { stdio: 'inherit' });
    
    // Apply all migrations
    console.log('Applying migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    // Seed the database (includes admin user cleanup and product seeding)
    console.log('Seeding database...');
    execSync('node scripts/seed-db.js', { stdio: 'inherit' });
    
    console.log('✅ Database reset and seeding completed successfully!');
    console.log('');
    console.log('Admin credentials:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    console.log('');
    console.log('Database now contains:');
    console.log('- 1 admin user');
    console.log('- 1 regular user');
    console.log('- 10 sample products');
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  }
}

resetDatabase(); 
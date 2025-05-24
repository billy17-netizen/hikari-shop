// This script checks if products are in the database
// Run with: npx ts-node scripts/check-products.js

const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

// Function to format price in IDR
function formatIDR(price) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

async function checkProducts() {
  try {
    console.log('Checking products in database...');
    
    // Count products
    const productCount = await prisma.product.count();
    console.log(`Total products: ${productCount}`);
    
    if (productCount === 0) {
      console.log('No products found in database.');
      return;
    }
    
    // Get all products
    const products = await prisma.product.findMany({
      orderBy: {
        id: 'asc'
      }
    });
    
    console.log('\nProducts:');
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Price: ${formatIDR(product.price)}`);
      console.log(`   Slug: ${product.slug}`);
      console.log(`   Images: ${product.images.length}`);
      console.log(`   Sizes: ${product.sizes.join(', ')}`);
      console.log(`   Colors: ${product.colors.join(', ')}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error checking products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProducts(); 
const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const slugify = require('slugify');

const prisma = new PrismaClient();

// Sample product data
const products = [
  {
    name: "Classic White T-Shirt",
    price: 449000,
    description: "A timeless classic white t-shirt made from premium cotton for everyday comfort.",
    images: ["/images/products/tshirt-white-1.jpg", "/images/products/tshirt-white-2.jpg"],
    details: ["100% Premium Cotton", "Regular fit", "Machine washable", "Made in Japan"],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["White"],
    inStock: true
  },
  {
    name: "Black Denim Jeans",
    price: 1349000,
    description: "Stylish black denim jeans with a modern slim fit design, perfect for any casual occasion.",
    images: ["/images/products/jeans-black-1.jpg", "/images/products/jeans-black-2.jpg"],
    details: ["98% Cotton, 2% Elastane", "Slim fit", "5-pocket styling", "Machine washable"],
    sizes: ["28", "30", "32", "34", "36"],
    colors: ["Black"],
    inStock: true
  },
  {
    name: "Minimalist Leather Watch",
    price: 1950000,
    description: "Elegant minimalist watch with genuine leather strap and Japanese quartz movement.",
    images: ["/images/products/watch-leather-1.jpg", "/images/products/watch-leather-2.jpg"],
    details: ["Japanese quartz movement", "Genuine leather strap", "Stainless steel case", "Water resistant up to 30m"],
    sizes: ["One Size"],
    colors: ["Brown", "Black"],
    inStock: true
  },
  {
    name: "Canvas Tote Bag",
    price: 750000,
    description: "Durable canvas tote bag with ample space for your everyday essentials.",
    images: ["/images/products/tote-canvas-1.jpg", "/images/products/tote-canvas-2.jpg"],
    details: ["100% Heavy-duty canvas", "Interior pocket", "Reinforced handles", "Dimensions: 40cm x 35cm x 15cm"],
    sizes: ["One Size"],
    colors: ["Natural", "Black", "Navy"],
    inStock: true
  },
  {
    name: "Wool Blend Coat",
    price: 2999000,
    description: "Premium wool blend coat with a tailored fit, perfect for colder seasons.",
    images: ["/images/products/coat-wool-1.jpg", "/images/products/coat-wool-2.jpg"],
    details: ["70% Wool, 30% Polyester", "Tailored fit", "Fully lined", "Dry clean only"],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Camel", "Charcoal", "Navy"],
    inStock: true
  },
  {
    name: "Silk Scarf",
    price: 899000,
    description: "Luxurious silk scarf with a beautiful printed design to elevate any outfit.",
    images: ["/images/products/scarf-silk-1.jpg", "/images/products/scarf-silk-2.jpg"],
    details: ["100% Pure silk", "Dimensions: 90cm x 90cm", "Hand rolled edges", "Dry clean recommended"],
    sizes: ["One Size"],
    colors: ["Blue Pattern", "Red Pattern", "Geometric"],
    inStock: true
  },
  {
    name: "Leather Card Holder",
    price: 599000,
    description: "Slim leather card holder with multiple slots for essential cards and bills.",
    images: ["/images/products/cardholder-leather-1.jpg", "/images/products/cardholder-leather-2.jpg"],
    details: ["Genuine leather", "4 card slots", "1 bill compartment", "Dimensions: 10cm x 7cm"],
    sizes: ["One Size"],
    colors: ["Black", "Brown", "Tan"],
    inStock: true
  },
  {
    name: "Linen Summer Shirt",
    price: 1050000,
    description: "Breathable linen shirt perfect for warm summer days, featuring a relaxed fit.",
    images: ["/images/products/shirt-linen-1.jpg", "/images/products/shirt-linen-2.jpg"],
    details: ["100% Linen", "Relaxed fit", "Button-down collar", "Machine washable cold"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["White", "Light Blue", "Beige"],
    inStock: true
  },
  {
    name: "Cashmere Beanie",
    price: 690000,
    description: "Soft and warm cashmere beanie for ultimate comfort during cold weather.",
    images: ["/images/products/beanie-cashmere-1.jpg", "/images/products/beanie-cashmere-2.jpg"],
    details: ["100% Cashmere", "Ribbed texture", "One size fits most", "Hand wash cold"],
    sizes: ["One Size"],
    colors: ["Grey", "Black", "Navy", "Burgundy"],
    inStock: true
  },
  {
    name: "Polarized Sunglasses",
    price: 1199000,
    description: "Stylish polarized sunglasses with UV protection and durable acetate frames.",
    images: ["/images/products/sunglasses-polarized-1.jpg", "/images/products/sunglasses-polarized-2.jpg"],
    details: ["Polarized lenses", "100% UV protection", "Acetate frames", "Includes protective case"],
    sizes: ["One Size"],
    colors: ["Black", "Tortoise", "Clear"],
    inStock: true
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clean up existing data (except admin users)
    console.log('Cleaning up existing data (preserving admin users)...');
    
    // Delete all users except admins
    await prisma.user.deleteMany({
      where: {
        role: {
          not: 'admin'
        }
      }
    });
    
    // Create test user
    console.log('Creating test user...');
    const testUserPassword = await bcrypt.hash('user1234', 10);
    
    await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'user@example.com',
        password: testUserPassword,
        role: 'user',
      },
    });
    
    // Clean up admin users - ensure only one exists
    console.log('Cleaning up admin users...');
    
    // Find all admin users
    const adminUsers = await prisma.user.findMany({
      where: {
        role: 'admin'
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    console.log(`Found ${adminUsers.length} admin user(s)`);
    
    if (adminUsers.length === 0) {
      // No admin users found, create one
      console.log('No admin users found, creating one...');
      // Use a pre-generated hash that we know works for 'admin123'
      const adminPassword = '$2b$10$IvfuzJ.LF3ujUGOGwguPqOsmItPDsuNeqvQRUdJjEy13Y2MpkjzGG';
      
      await prisma.user.create({
        data: {
          id: 'admin-default-001',
          name: 'Admin User',
          email: 'admin@example.com',
          password: adminPassword,
          role: 'admin',
        },
      });
    } else if (adminUsers.length > 1) {
      // Keep the first admin user and delete the rest
      const [keepAdmin, ...deleteAdmins] = adminUsers;
      
      console.log(`Keeping admin: ${keepAdmin.email} (${keepAdmin.id})`);
      console.log(`Deleting ${deleteAdmins.length} extra admin user(s)...`);
      
      // Delete all other admin users
      for (const admin of deleteAdmins) {
        console.log(`Deleting admin: ${admin.email} (${admin.id})`);
        await prisma.user.delete({
          where: {
            id: admin.id
          }
        });
      }
      
      // Update the remaining admin user to have the standard email if needed
      if (keepAdmin.email !== 'admin@example.com') {
        console.log(`Updating admin email from ${keepAdmin.email} to admin@example.com`);
        await prisma.user.update({
          where: {
            id: keepAdmin.id
          },
          data: {
            email: 'admin@example.com',
            name: 'Admin User'
          }
        });
      }
      
      // Always update the password to ensure it's correct
      console.log('Updating admin password to ensure it is correct');
      await prisma.user.update({
        where: {
          email: 'admin@example.com'
        },
        data: {
          password: '$2b$10$IvfuzJ.LF3ujUGOGwguPqOsmItPDsuNeqvQRUdJjEy13Y2MpkjzGG'
        }
      });
    } else {
      // Just one admin user, make sure it has the right email
      const admin = adminUsers[0];
      if (admin.email !== 'admin@example.com') {
        console.log(`Updating admin email from ${admin.email} to admin@example.com`);
        await prisma.user.update({
          where: {
            id: admin.id
          },
          data: {
            email: 'admin@example.com',
            name: 'Admin User'
          }
        });
      }
      
      // Always update the password to ensure it's correct
      console.log('Updating admin password to ensure it is correct');
      await prisma.user.update({
        where: {
          email: 'admin@example.com'
        },
        data: {
          password: '$2b$10$IvfuzJ.LF3ujUGOGwguPqOsmItPDsuNeqvQRUdJjEy13Y2MpkjzGG'
        }
      });
    }
    
    // Seed products
    console.log('Seeding products...');
    
    // Check for existing products
    const existingProductCount = await prisma.product.count();
    console.log(`Found ${existingProductCount} existing products`);
    
    if (existingProductCount > 0) {
      console.log('Deleting existing products...');
      await prisma.product.deleteMany({});
    }
    
    // Create products with slugs
    const productsWithSlugs = products.map(product => ({
      ...product,
      slug: slugify(product.name, { lower: true, strict: true })
    }));
    
    // Insert products
    console.log('Creating new products...');
    const createdProducts = await prisma.product.createMany({
      data: productsWithSlugs
    });
    
    console.log(`✅ Successfully created ${createdProducts.count} products!`);
    
    console.log('✅ Database seeding completed successfully!');
    console.log('');
    console.log('Admin credentials:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    console.log('');
    console.log('Test user credentials:');
    console.log('Email: user@example.com');
    console.log('Password: user1234');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase(); 
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();
const slugify = require('slugify');

// Sample product data
const products = [
  {
    name: "Classic White T-Shirt",
    price: 29.99,
    description: "A timeless classic white t-shirt made from premium cotton for everyday comfort.",
    images: ["/images/products/tshirt-white-1.jpg", "/images/products/tshirt-white-2.jpg"],
    details: ["100% Premium Cotton", "Regular fit", "Machine washable", "Made in Japan"],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["White"],
    inStock: true
  },
  {
    name: "Black Denim Jeans",
    price: 89.99,
    description: "Stylish black denim jeans with a modern slim fit design, perfect for any casual occasion.",
    images: ["/images/products/jeans-black-1.jpg", "/images/products/jeans-black-2.jpg"],
    details: ["98% Cotton, 2% Elastane", "Slim fit", "5-pocket styling", "Machine washable"],
    sizes: ["28", "30", "32", "34", "36"],
    colors: ["Black"],
    inStock: true
  },
  {
    name: "Minimalist Leather Watch",
    price: 129.99,
    description: "Elegant minimalist watch with genuine leather strap and Japanese quartz movement.",
    images: ["/images/products/watch-leather-1.jpg", "/images/products/watch-leather-2.jpg"],
    details: ["Japanese quartz movement", "Genuine leather strap", "Stainless steel case", "Water resistant up to 30m"],
    sizes: ["One Size"],
    colors: ["Brown", "Black"],
    inStock: true
  },
  {
    name: "Canvas Tote Bag",
    price: 49.99,
    description: "Durable canvas tote bag with ample space for your everyday essentials.",
    images: ["/images/products/tote-canvas-1.jpg", "/images/products/tote-canvas-2.jpg"],
    details: ["100% Heavy-duty canvas", "Interior pocket", "Reinforced handles", "Dimensions: 40cm x 35cm x 15cm"],
    sizes: ["One Size"],
    colors: ["Natural", "Black", "Navy"],
    inStock: true
  },
  {
    name: "Wool Blend Coat",
    price: 199.99,
    description: "Premium wool blend coat with a tailored fit, perfect for colder seasons.",
    images: ["/images/products/coat-wool-1.jpg", "/images/products/coat-wool-2.jpg"],
    details: ["70% Wool, 30% Polyester", "Tailored fit", "Fully lined", "Dry clean only"],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Camel", "Charcoal", "Navy"],
    inStock: true
  },
  {
    name: "Silk Scarf",
    price: 59.99,
    description: "Luxurious silk scarf with a beautiful printed design to elevate any outfit.",
    images: ["/images/products/scarf-silk-1.jpg", "/images/products/scarf-silk-2.jpg"],
    details: ["100% Pure silk", "Dimensions: 90cm x 90cm", "Hand rolled edges", "Dry clean recommended"],
    sizes: ["One Size"],
    colors: ["Blue Pattern", "Red Pattern", "Geometric"],
    inStock: true
  },
  {
    name: "Leather Card Holder",
    price: 39.99,
    description: "Slim leather card holder with multiple slots for essential cards and bills.",
    images: ["/images/products/cardholder-leather-1.jpg", "/images/products/cardholder-leather-2.jpg"],
    details: ["Genuine leather", "4 card slots", "1 bill compartment", "Dimensions: 10cm x 7cm"],
    sizes: ["One Size"],
    colors: ["Black", "Brown", "Tan"],
    inStock: true
  },
  {
    name: "Linen Summer Shirt",
    price: 69.99,
    description: "Breathable linen shirt perfect for warm summer days, featuring a relaxed fit.",
    images: ["/images/products/shirt-linen-1.jpg", "/images/products/shirt-linen-2.jpg"],
    details: ["100% Linen", "Relaxed fit", "Button-down collar", "Machine washable cold"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["White", "Light Blue", "Beige"],
    inStock: true
  },
  {
    name: "Cashmere Beanie",
    price: 45.99,
    description: "Soft and warm cashmere beanie for ultimate comfort during cold weather.",
    images: ["/images/products/beanie-cashmere-1.jpg", "/images/products/beanie-cashmere-2.jpg"],
    details: ["100% Cashmere", "Ribbed texture", "One size fits most", "Hand wash cold"],
    sizes: ["One Size"],
    colors: ["Grey", "Black", "Navy", "Burgundy"],
    inStock: true
  },
  {
    name: "Polarized Sunglasses",
    price: 79.99,
    description: "Stylish polarized sunglasses with UV protection and durable acetate frames.",
    images: ["/images/products/sunglasses-polarized-1.jpg", "/images/products/sunglasses-polarized-2.jpg"],
    details: ["Polarized lenses", "100% UV protection", "Acetate frames", "Includes protective case"],
    sizes: ["One Size"],
    colors: ["Black", "Tortoise", "Clear"],
    inStock: true
  }
];

async function seedProducts() {
  try {
    console.log('🌱 Starting product seeding...');
    
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
    
    // List the created products
    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        slug: true
      },
      orderBy: {
        id: 'asc'
      }
    });
    
    console.log('\nCreated Products:');
    allProducts.forEach(product => {
      console.log(`${product.id}. ${product.name} - $${product.price} (${product.slug})`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedProducts(); 
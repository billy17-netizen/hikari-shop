import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding settings...');

  try {
    // Clear any existing settings using raw SQL
    await prisma.$executeRaw`TRUNCATE TABLE "Settings" CASCADE`;

    // General settings
    const generalSettings = [
      { category: 'general', key: 'siteName', value: 'Hikari Shop' },
      { category: 'general', key: 'siteDescription', value: 'Modern fashion store with high quality products' },
      { category: 'general', key: 'contactEmail', value: 'support@hikarishop.com' },
      { category: 'general', key: 'phoneNumber', value: '+62 123 456 7890' },
    ];

    // Shipping settings
    const shippingSettings = [
      { category: 'shipping', key: 'enableFreeShipping', value: 'true' },
      { category: 'shipping', key: 'freeShippingThreshold', value: '500000' },
      { category: 'shipping', key: 'defaultShippingFee', value: '25000' },
    ];

    // Payment settings
    const paymentSettings = [
      { category: 'payment', key: 'enableMidtrans', value: 'true' },
      { category: 'payment', key: 'enableCashOnDelivery', value: 'true' },
      { category: 'payment', key: 'maxCODAmount', value: '5000000' },
    ];

    // Store status settings
    const storeSettings = [
      { category: 'store', key: 'maintenanceMode', value: 'false' },
    ];

    // Combine all settings
    const allSettings = [
      ...generalSettings,
      ...shippingSettings,
      ...paymentSettings,
      ...storeSettings,
    ];

    // Create settings with raw SQL
    for (const setting of allSettings) {
      await prisma.$executeRaw`
        INSERT INTO "Settings" (
          "id",
          "category",
          "key",
          "value",
          "createdAt",
          "updatedAt"
        ) VALUES (
          ${`setting-${setting.category}-${setting.key}`},
          ${setting.category},
          ${setting.key},
          ${setting.value},
          ${new Date()},
          ${new Date()}
        )
      `;
      console.log(`Created setting: ${setting.category}.${setting.key} = ${setting.value}`);
    }

    console.log('Settings seeding completed!');
  } catch (error) {
    console.error('Error during settings seeding:', error);
    process.exit(1);
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
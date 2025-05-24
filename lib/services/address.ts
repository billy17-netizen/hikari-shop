import { PrismaClient } from '../../src/generated/prisma';

// Create a new client with debug logging for troubleshooting
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

export async function getUserAddresses(userId: string) {
  try {
    console.log(`Getting addresses for user ID: ${userId}`);
    return await prisma.address.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  } catch (error) {
    console.error('Error in getUserAddresses:', error);
    throw error;
  }
}

export async function getAddress(id: string) {
  try {
    return await prisma.address.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error(`Error in getAddress for ID ${id}:`, error);
    throw error;
  }
}

export async function createAddress(data: {
  userId: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}) {
  try {
    // If this is the first address or set as default, ensure it's the only default
    if (data.isDefault) {
      await resetDefaultAddresses(data.userId);
    }

    return await prisma.address.create({
      data,
    });
  } catch (error) {
    console.error('Error in createAddress:', error);
    throw error;
  }
}

export async function updateAddress(
  id: string,
  data: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
    isDefault?: boolean;
  }
) {
  try {
    // If setting as default, reset other defaults
    if (data.isDefault) {
      const address = await prisma.address.findUnique({ 
        where: { id },
        select: { userId: true }
      });
      
      if (address) {
        await resetDefaultAddresses(address.userId);
      }
    }

    return await prisma.address.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error(`Error in updateAddress for ID ${id}:`, error);
    throw error;
  }
}

export async function deleteAddress(id: string) {
  try {
    // Get the address before deletion to check if it's default
    const address = await prisma.address.findUnique({
      where: { id },
      select: { userId: true, isDefault: true },
    });

    const deletedAddress = await prisma.address.delete({
      where: { id },
    });

    // If it was the default address, set a new default if any addresses remain
    if (address?.isDefault) {
      const firstAddress = await prisma.address.findFirst({
        where: { userId: address.userId },
        orderBy: { createdAt: 'asc' },
      });

      if (firstAddress) {
        await prisma.address.update({
          where: { id: firstAddress.id },
          data: { isDefault: true },
        });
      }
    }

    return deletedAddress;
  } catch (error) {
    console.error(`Error in deleteAddress for ID ${id}:`, error);
    throw error;
  }
}

// Helper function to reset default addresses for a user
async function resetDefaultAddresses(userId: string) {
  try {
    await prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  } catch (error) {
    console.error(`Error in resetDefaultAddresses for user ${userId}:`, error);
    throw error;
  }
} 
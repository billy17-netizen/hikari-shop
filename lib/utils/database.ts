import prisma from '../db';
import { Product } from '../../types/product';
import { PrismaClient } from '@prisma/client';

/**
 * Converts Prisma objects with Decimal and Date fields to serializable objects
 */
export function serializeProduct(product: any): Product {
  return {
    ...product,
    price: product.price.toString(),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString()
  };
}

/**
 * Fetches a product by slug and serializes it
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const product = await prisma.product.findUnique({
      where: {
        slug: slug,
      },
    });
    
    if (!product) return null;
    
    return serializeProduct(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

/**
 * Fetches all products and serializes them
 */
export async function getAllProducts(orderBy?: any): Promise<Product[]> {
  try {
    const products = await prisma.product.findMany({
      orderBy: orderBy || { id: 'asc' }
    });
    
    return products.map(serializeProduct);
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

/**
 * Get related products, excluding the current product
 */
export async function getRelatedProducts(currentProductId: number, limit: number = 4): Promise<Product[]> {
  try {
    const relatedProducts = await prisma.product.findMany({
      where: {
        id: {
          not: currentProductId
        },
        inStock: true
      },
      orderBy: {
        id: 'desc'
      },
      take: limit,
    });
    
    return relatedProducts.map(serializeProduct);
  } catch (error) {
    console.error('Error fetching related products:', error);
    return [];
  }
} 
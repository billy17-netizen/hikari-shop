// Product type definition for serialized product data
export interface Product {
  id: number;
  name: string;
  price: string; // Stored as string after Decimal conversion
  images: string[];
  slug: string;
  description: string;
  details: string[];
  sizes: string[];
  colors: string[];
  inStock: boolean;
  createdAt: string; // ISO string format
  updatedAt: string; // ISO string format
} 
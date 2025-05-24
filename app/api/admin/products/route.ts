import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { serializeProduct } from '../../../../lib/utils/database';

// GET /api/admin/products - Get all products
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and an admin
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || '';
    const stockFilter = searchParams.get('stock') || 'all';
    const sortField = searchParams.get('sortField') || 'id';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build the where clause for filtering
    let where: any = {};

    // Apply search filter
    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { slug: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    // Apply stock filter
    if (stockFilter === 'inStock') {
      where.inStock = true;
    } else if (stockFilter === 'outOfStock') {
      where.inStock = false;
    }

    // Build the orderBy object
    const orderBy: any = {};
    orderBy[sortField] = sortOrder;

    // Fetch products with filtering, sorting, and pagination
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    // Return serialized products with pagination info
    return NextResponse.json({
      products: products.map(serializeProduct),
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Error fetching products' },
      { status: 500 }
    );
  }
}

// POST /api/admin/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and an admin
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const data = await request.json();

    // Validate required fields
    const requiredFields = ['name', 'price', 'slug', 'description'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate slug uniqueness
    const existingProduct = await prisma.product.findUnique({
      where: { slug: data.slug },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: 'A product with this slug already exists' },
        { status: 400 }
      );
    }

    // Create the product
    const product = await prisma.product.create({
      data: {
        name: data.name,
        price: data.price,
        slug: data.slug,
        description: data.description,
        details: data.details || [],
        sizes: data.sizes || [],
        colors: data.colors || [],
        images: data.images || [],
        inStock: data.inStock !== undefined ? data.inStock : true,
      },
    });

    return NextResponse.json(serializeProduct(product), { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Error creating product' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products - Bulk delete products
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and an admin
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body for product IDs to delete
    const data = await request.json();
    const { ids } = data;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'No product IDs provided for deletion' },
        { status: 400 }
      );
    }

    // Delete products
    const result = await prisma.product.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return NextResponse.json({
      deletedCount: result.count,
      message: `Successfully deleted ${result.count} products`,
    });
  } catch (error) {
    console.error('Error deleting products:', error);
    return NextResponse.json(
      { error: 'Error deleting products' },
      { status: 500 }
    );
  }
} 
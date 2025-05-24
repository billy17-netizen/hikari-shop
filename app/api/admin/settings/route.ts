import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { PrismaClient } from '../../../../src/generated/prisma';

const prisma = new PrismaClient();

// Get all settings
export async function GET(req: NextRequest) {
  try {
    // Verify user is logged in and is an admin
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Get all settings
    const settings = await prisma.settings.findMany();
    
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Update settings
export async function PUT(req: NextRequest) {
  try {
    // Verify user is logged in and is an admin
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Get settings from request body
    const body = await req.json();
    const { settings } = body;
    
    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json(
        { message: 'Invalid request format' },
        { status: 400 }
      );
    }
    
    // Update each setting
    const updates = [];
    
    for (const setting of settings) {
      const { category, key, value } = setting;
      
      if (!category || !key || value === undefined) {
        continue;
      }
      
      // Check if setting exists
      const existingSetting = await prisma.settings.findFirst({
        where: {
          category,
          key
        }
      });
      
      // Update or create setting
      if (existingSetting) {
        updates.push(
          prisma.settings.update({
            where: {
              id: existingSetting.id
            },
            data: {
              value,
              updatedAt: new Date()
            }
          })
        );
      } else {
        updates.push(
          prisma.settings.create({
            data: {
              category,
              key,
              value
            }
          })
        );
      }
    }
    
    // Execute all updates
    await Promise.all(updates);
    
    return NextResponse.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 
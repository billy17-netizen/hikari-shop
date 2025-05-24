import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and an admin
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check if the request is multipart/form-data
    const formData = await req.formData();
    const file = formData.get("productImage") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }
    
    // Validate file
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB max
      return NextResponse.json(
        { error: "Image must be less than 5MB" },
        { status: 400 }
      );
    }
    
    // Get file extension
    const fileExt = file.name.split(".").pop() || "jpg";
    
    // Create a unique filename
    const fileName = `product-${uuidv4()}.${fileExt}`;
    
    // Create path to public directory
    const publicDir = path.join(process.cwd(), "public");
    const uploadDir = path.join(publicDir, "uploads", "products");
    
    // Ensure directory exists
    if (!existsSync(uploadDir)) {
      console.log("Creating product uploads directory");
      await mkdir(uploadDir, { recursive: true });
    }
    
    // Create path to save file
    const filePath = path.join(uploadDir, fileName);
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Write file to disk
    await writeFile(filePath, buffer);
    console.log("Product image saved to:", filePath);
    
    // Create relative URL for the image
    const imageUrl = `/uploads/products/${fileName}`;
    console.log("Product image URL:", imageUrl);
    
    return NextResponse.json({
      message: "Product image uploaded successfully",
      imageUrl
    }, { status: 200 });
  } catch (error) {
    console.error("Error uploading product image:", error);
    return NextResponse.json(
      { error: "Failed to upload product image" },
      { status: 500 }
    );
  }
} 
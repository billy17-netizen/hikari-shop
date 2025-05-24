'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Product } from '../../../../../types/product';

// Define a type for product images that can be either a string URL or a temporary image object
type ProductImage = string | {
  url: string;
  isUploading: boolean;
  tempId: string;
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    slug: '',
    description: '',
    details: '',
    sizes: '',
    colors: '',
    inStock: true
  });
  
  // Fetch existing product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Fetch product data from the database
        const response = await fetch(`/api/admin/products/${productId}`);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const product = await response.json();
        
        // Update form data with product values
        setFormData({
          name: product.name,
          price: product.price,
          slug: product.slug,
          description: product.description,
          details: Array.isArray(product.details) ? product.details.join(', ') : product.details,
          sizes: Array.isArray(product.sizes) ? product.sizes.join(', ') : product.sizes,
          colors: Array.isArray(product.colors) ? product.colors.join(', ') : product.colors,
          inStock: product.inStock
        });
        
        setProductImages(product.images || []);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching product:', error);
        setErrorMessage('Error loading product. Please try again.');
        setIsLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      // Only update slug if it was standard (name-based)
      slug: prev.slug === prev.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') 
        ? name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
        : prev.slug
    }));
  };
  
  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      
      for (const file of files) {
        // Validate file type
        if (!file.type.match('image.*')) {
          alert('Please select only image files');
          continue;
        }
        
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          alert('File size should be less than 5MB');
          continue;
        }
        
        // Create a temporary ID for this upload
        const tempId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
        
        try {
          // Create a temporary preview for immediate feedback
          const reader = new FileReader();
          reader.onload = (event) => {
            const target = event.target;
            if (!target || !target.result) return;
            
            // Add a temporary preview with a loading indicator
            setProductImages(prev => [...prev, {
              url: target.result as string,
              isUploading: true,
              tempId
            }]);
          };
          reader.readAsDataURL(file);
          
          // Create form data for upload
          const formData = new FormData();
          formData.append('productImage', file);
          
          // Upload to server
          const response = await fetch('/api/admin/products/upload-image', {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to upload image');
          }
          
          const data = await response.json();
          
          // Replace the temporary preview with the actual URL from the server
          setProductImages(prev => prev.map(img => {
            if (typeof img === 'string') return img;
            if (img.isUploading && img.tempId === tempId) {
              return data.imageUrl;
            }
            return img;
          }));
        } catch (error) {
          console.error('Error uploading image:', error);
          alert('Failed to upload image. Please try again.');
          
          // Remove the temporary preview
          setProductImages(prev => prev.filter(img => {
            if (typeof img === 'string') return true;
            return !(img.isUploading && img.tempId === tempId);
          }));
        }
      }
    }
  };
  
  // Remove an image
  const removeImage = (index: number) => {
    const newImages = [...productImages];
    newImages.splice(index, 1);
    setProductImages(newImages);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    
    const toastId = toast.loading(`Updating product "${formData.name}"...`);
    
    try {
      // Convert comma-separated strings to arrays
      const productData = {
        id: Number(productId),
        ...formData,
        details: formData.details.split(',').map(item => item.trim()),
        sizes: formData.sizes.split(',').map(item => item.trim()),
        colors: formData.colors.split(',').map(item => item.trim()),
        // Filter out any temporary image objects and keep only string URLs
        images: productImages.filter(img => typeof img === 'string') as string[],
        price: formData.price,
      };
      
      // Send updated product data to the API
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      toast.success(`Product "${formData.name}" updated successfully`, { id: toastId });
      
      // Redirect back to products list
      router.push('/admin/products');
    } catch (error) {
      console.error('Error updating product:', error);
      setErrorMessage('Error updating product. Please try again.');
      toast.error('Failed to update product', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Cancel edit and go back to products list
  const handleCancel = () => {
    router.push('/admin/products');
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neutral-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Product</h1>
        <Link href="/admin/products" className="px-4 py-2 bg-neutral-100 text-neutral-800 rounded-sm hover:bg-neutral-200">
          Back to Products
        </Link>
      </div>
      
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-sm">
          {errorMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-sm shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium border-b pb-2">Basic Information</h2>
            
            {/* Product Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
                Product Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleNameChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                required
              />
            </div>
            
            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-neutral-700 mb-1">
                Price (IDR)
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                required
                min="0"
              />
            </div>
            
            {/* Slug */}
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-neutral-700 mb-1">
                Slug
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                required
                pattern="[a-z0-9-]+"
                title="Lowercase letters, numbers, and hyphens only"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Used in the URL, e.g., /products/your-slug
              </p>
            </div>
            
            {/* In Stock */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="inStock"
                name="inStock"
                checked={formData.inStock}
                onChange={handleInputChange}
                className="h-4 w-4 text-neutral-900 focus:ring-neutral-500 border-neutral-300 rounded"
              />
              <label htmlFor="inStock" className="ml-2 block text-sm text-neutral-700">
                In Stock
              </label>
            </div>
          </div>
          
          {/* Product Details */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium border-b pb-2">Product Details</h2>
            
            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-neutral-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                required
              ></textarea>
            </div>
            
            {/* Product Details */}
            <div>
              <label htmlFor="details" className="block text-sm font-medium text-neutral-700 mb-1">
                Product Details (comma separated)
              </label>
              <textarea
                id="details"
                name="details"
                value={formData.details}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                placeholder="100% Cotton, Machine washable, etc."
              ></textarea>
            </div>
            
            {/* Sizes */}
            <div>
              <label htmlFor="sizes" className="block text-sm font-medium text-neutral-700 mb-1">
                Available Sizes (comma separated)
              </label>
              <input
                type="text"
                id="sizes"
                name="sizes"
                value={formData.sizes}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                placeholder="S, M, L, XL"
              />
            </div>
            
            {/* Colors */}
            <div>
              <label htmlFor="colors" className="block text-sm font-medium text-neutral-700 mb-1">
                Available Colors (comma separated)
              </label>
              <input
                type="text"
                id="colors"
                name="colors"
                value={formData.colors}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                placeholder="Black, White, Blue"
              />
            </div>
          </div>
          
          {/* Product Images */}
          <div className="md:col-span-2">
            <div className="mb-2 flex justify-between items-center">
              <label className="block text-sm font-medium text-neutral-700">
                Product Images
              </label>
              <div className="flex items-center">
                <input
                  type="file"
                  id="images"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label
                  htmlFor="images"
                  className="cursor-pointer bg-neutral-800 text-white text-sm px-3 py-1 rounded-sm hover:bg-neutral-700"
                >
                  Add Images
                </label>
              </div>
            </div>
            
            {/* Image preview */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {productImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={typeof image === 'string' ? image : image.url}
                    alt={`Product image ${index + 1}`}
                    className={`h-40 w-full object-cover rounded-sm border border-neutral-200 ${typeof image !== 'string' && image.isUploading ? 'opacity-50' : ''}`}
                    onError={(e) => {
                      // If image fails to load, use a fallback image
                      console.log("Image failed to load:", image);
                      const fallbackUrl = "/placeholder-product.jpg";
                      e.currentTarget.src = fallbackUrl;
                      e.currentTarget.onerror = null; // Prevent infinite loop
                    }}
                  />
                  {typeof image !== 'string' && image.isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-neutral-800"></span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                    Image {index + 1}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={typeof image !== 'string' && image.isUploading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              ))}
              
              {productImages.length === 0 && (
                <div className="flex items-center justify-center h-40 bg-neutral-50 border border-neutral-200 border-dashed rounded-sm">
                  <p className="text-sm text-neutral-500">No images added</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Buttons */}
        <div className="mt-8 flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-neutral-300 rounded-sm text-neutral-700 hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-neutral-900 text-white rounded-sm hover:bg-neutral-800 disabled:opacity-75"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
} 